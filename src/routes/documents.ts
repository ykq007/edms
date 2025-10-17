import { DocumentStatus } from "@prisma/client";
import Busboy from "busboy";
import crypto from "crypto";
import type { Request } from "express";
import { Router } from "express";
import { createWriteStream } from "fs";
import { promises as fsPromises } from "fs";
import path from "path";
import { Transform, type TransformCallback } from "stream";
import { pipeline } from "stream/promises";
import { config } from "../config";
import { HttpError } from "../errors/httpError";
import prisma from "../lib/prisma";
import { ocrQueue } from "../lib/queue";

const documentsRouter = Router();

interface UploadResult {
  checksum: string;
  mimeType: string;
  originalName: string;
  size: number;
  storagePath: string;
}

class HashingStream extends Transform {
  private readonly hash = crypto.createHash("sha256");

  private bytes = 0;

  private finalised = false;

  _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
    this.hash.update(chunk);
    this.bytes += chunk.length;
    callback(null, chunk);
  }

  result(): { checksum: string; bytes: number } {
    if (this.finalised) {
      throw new Error("Hash already finalised");
    }

    this.finalised = true;
    return {
      checksum: this.hash.digest("hex"),
      bytes: this.bytes,
    };
  }
}

const createStoragePath = async (documentId: string, originalName: string): Promise<string> => {
  await fsPromises.mkdir(path.join(config.documentStoragePath, documentId), {
    recursive: true,
  });

  const extension = path.extname(originalName);
  const storedFileName = extension ? `${documentId}${extension}` : documentId;
  return path.join(config.documentStoragePath, documentId, storedFileName);
};

const processUploadStream = async (
  req: Request,
  documentId: string,
  onFilePath: (filePath: string) => void,
): Promise<UploadResult> => {
  await fsPromises.mkdir(config.documentStoragePath, { recursive: true });

  return await new Promise<UploadResult>((resolve, reject) => {
    let settled = false;
    let fileHandled = false;

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        files: 1,
        fileSize: config.maxUploadBytes,
      },
    });

    let handleAborted: () => void;
    let handleRequestError: (error: Error) => void;

    const succeed = (value: UploadResult) => {
      if (settled) {
        return;
      }
      settled = true;

      try {
        req.unpipe(busboy);
      } catch {}

      req.removeListener("aborted", handleAborted);
      req.removeListener("error", handleRequestError);
      busboy.removeAllListeners();
      resolve(value);
    };

    const fail = (error: unknown) => {
      if (settled) {
        return;
      }
      settled = true;

      try {
        req.unpipe(busboy);
      } catch {}

      req.resume();
      req.removeListener("aborted", handleAborted);
      req.removeListener("error", handleRequestError);
      busboy.removeAllListeners();
      reject(error);
    };

    handleAborted = () => {
      fail(new HttpError(408, "Client aborted the upload request"));
    };

    handleRequestError = (error: Error) => {
      fail(error);
    };

    busboy.on("file", (fieldName, file, info) => {
      if (fieldName !== "file") {
        file.resume();
        return;
      }

      if (fileHandled) {
        file.resume();
        fail(new HttpError(400, "Multiple files per upload are not supported"));
        return;
      }

      fileHandled = true;
      const originalName = path.basename(info.filename ?? "");

      if (!originalName) {
        file.resume();
        fail(new HttpError(400, "Uploaded file must include a filename"));
        return;
      }

      const mimeType = info.mimeType || "application/octet-stream";

      void createStoragePath(documentId, originalName)
        .then((storagePath) => {
          onFilePath(storagePath);

          const hashingStream = new HashingStream();
          const writeStream = createWriteStream(storagePath);

          const limitError = new HttpError(413, "File exceeds maximum allowed size", {
            limitBytes: config.maxUploadBytes,
            limitMb: config.maxUploadSizeMb,
          });

          file.once("limit", () => {
            writeStream.destroy(limitError);
            file.destroy(limitError);
            fail(limitError);
            return;
          });

          pipeline(file, hashingStream, writeStream)
            .then(() => {
              if (settled) {
                return;
              }

              const { checksum, bytes } = hashingStream.result();
              succeed({
                checksum,
                mimeType,
                originalName,
                size: bytes,
                storagePath,
              });
            })
            .catch((streamError) => {
              fail(streamError);
            });
        })
        .catch((storageError) => {
          file.resume();
          fail(storageError);
        });
    });

    busboy.on("filesLimit", () => {
      fail(new HttpError(400, "Only one file can be uploaded per request"));
    });

    busboy.on("error", (error) => {
      fail(error);
    });

    busboy.on("finish", () => {
      if (!settled && !fileHandled) {
        fail(new HttpError(400, "Request payload did not include a file field named 'file'"));
      }
    });

    req.on("aborted", handleAborted);

    req.on("error", handleRequestError);

    req.pipe(busboy);
  });
};

documentsRouter.post("/upload", async (req, res, next) => {
  if (!req.headers["content-type"]?.includes("multipart/form-data")) {
    next(new HttpError(415, "Content-Type must be multipart/form-data"));
    return;
  }

  let document = await prisma.document.create({
    data: {
      status: DocumentStatus.UPLOADING,
    },
  });

  let storedFilePath: string | null = null;

  try {
    const uploadResult = await processUploadStream(req, document.id, (filePath) => {
      storedFilePath = filePath;
    });

    document = await prisma.document.update({
      where: { id: document.id },
      data: {
        status: DocumentStatus.UPLOADED,
        originalName: uploadResult.originalName,
        mimeType: uploadResult.mimeType,
        size: BigInt(uploadResult.size),
        checksum: uploadResult.checksum,
        storagePath: uploadResult.storagePath,
        error: null,
      },
    });

    await ocrQueue.add(
      "ocr-document",
      {
        documentId: document.id,
        storagePath: uploadResult.storagePath,
        checksum: uploadResult.checksum,
        mimeType: uploadResult.mimeType,
        originalName: uploadResult.originalName,
        size: uploadResult.size,
      },
      {
        attempts: config.ocrJobAttempts,
        backoff: {
          type: "fixed",
          delay: config.ocrJobBackoffMs,
        },
        removeOnComplete: true,
      },
    );

    document = await prisma.document.update({
      where: { id: document.id },
      data: {
        status: DocumentStatus.OCR_QUEUED,
        ocrQueuedAt: new Date(),
      },
    });

    res.status(201).json({
      documentId: document.id,
      status: document.status,
      checksum: uploadResult.checksum,
      originalName: uploadResult.originalName,
      mimeType: uploadResult.mimeType,
      size: uploadResult.size,
    });
  } catch (error) {
    if (storedFilePath) {
      await fsPromises.unlink(storedFilePath).catch(() => undefined);
    }

    await prisma.document
      .update({
        where: { id: document.id },
        data: {
          status: DocumentStatus.FAILED,
          error: error instanceof Error ? error.message : "Unknown upload failure",
        },
      })
      .catch(() => undefined);

    return next(error);
  }
});

export default documentsRouter;

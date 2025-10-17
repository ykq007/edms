import path from "path";

const parseInteger = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const ensureAbsolutePath = (inputPath: string): string => {
  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }

  return path.resolve(process.cwd(), inputPath);
};

const port = parseInteger(process.env.PORT ?? process.env.BACKEND_PORT, 8000);
const documentStoragePath = ensureAbsolutePath(
  process.env.DOCUMENT_STORAGE_PATH ?? "storage/documents"
);
const maxUploadSizeMb = parseInteger(process.env.MAX_UPLOAD_SIZE_MB, 512);
const maxUploadBytes = maxUploadSizeMb * 1024 * 1024;
const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379/0";
const ocrQueueName = process.env.OCR_QUEUE_NAME ?? "ocr";
const ocrJobAttempts = parseInteger(process.env.OCR_JOB_ATTEMPTS, 3);
const ocrJobBackoffMs = parseInteger(process.env.OCR_JOB_BACKOFF_MS, 5000);

export const config = {
  port,
  documentStoragePath,
  maxUploadSizeMb,
  maxUploadBytes,
  redisUrl,
  ocrQueueName,
  ocrJobAttempts,
  ocrJobBackoffMs,
} as const;

export type AppConfig = typeof config;

import http from "http";
import app from "./app";
import { config } from "./config";
import prisma from "./lib/prisma";
import { shutdownQueue } from "./lib/queue";

const server = http.createServer(app);

server.listen(config.port, () => {
  console.info(`Document service listening on port ${config.port}`);
});

let shuttingDown = false;

const shutdown = (signal: NodeJS.Signals) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.info(`Received ${signal}, initiating graceful shutdown`);
  server.close((closeError) => {
    if (closeError) {
      console.error("Error while closing HTTP server", closeError);
    }

    void (async () => {
      await shutdownQueue().catch((error) => {
        console.error("Failed to close BullMQ resources", error);
      });

      await prisma.$disconnect().catch((error) => {
        console.error("Failed to disconnect Prisma client", error);
      });

      const exitCode = closeError ? 1 : 0;
      process.exit(exitCode);
    })();
  });
};

["SIGTERM", "SIGINT"].forEach((signal) => {
  process.on(signal as NodeJS.Signals, () => shutdown(signal as NodeJS.Signals));
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception", error);
  shutdown("SIGTERM");
});

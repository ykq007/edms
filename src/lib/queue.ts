import { Queue, QueueScheduler } from "bullmq";
import IORedis from "ioredis";
import { config } from "../config";

const connection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

export const ocrQueue = new Queue(config.ocrQueueName, {
  connection,
});

export const ocrQueueScheduler = new QueueScheduler(config.ocrQueueName, {
  connection,
});

void ocrQueueScheduler.waitUntilReady().catch((error) => {
  console.error("Failed to initialise BullMQ queue scheduler", error);
});

export const shutdownQueue = async (): Promise<void> => {
  await Promise.allSettled([
    ocrQueueScheduler.close(),
    ocrQueue.close(),
  ]);
  await connection.quit();
};

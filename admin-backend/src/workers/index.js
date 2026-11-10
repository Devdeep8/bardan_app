// src/workers/index.js
// Single entrypoint for ALL queue consumers: `npm run worker`. Reads
// WORKER_REGISTRY and starts one BullMQ Worker per queue. New consumers just
// need a registry entry — this file never changes.
import { Worker } from 'bullmq';
import config from '@configs/app.config.js';
import { Logger } from '@src/utils/logger.js';
import { WORKER_REGISTRY } from '@src/workers/registry.js';

const connection = {
  host: config.get('redis.host'),
  port: Number(config.get('redis.port')),
  password: config.get('redis.password') || undefined,
  maxRetriesPerRequest: null
};

const workers = Object.entries(WORKER_REGISTRY).map(([queueName, consumer]) => {
  const worker = new Worker(queueName, async (job) => consumer.process(job), {
    connection,
    concurrency: 5
  });

  worker.on('failed', (job, err) => {
    Logger.error('Queue job failed', { queue: queueName, jobId: job?.id, error: err.message });
  });
  worker.on('error', (err) => {
    Logger.error('Queue worker error', { queue: queueName, error: err.message });
  });

  Logger.info(`Worker started for queue: ${queueName}`);
  return worker;
});

// Graceful shutdown: finish in-flight jobs, then close
const shutdown = async (signal) => {
  Logger.warn(`Worker process received ${signal}, shutting down...`);
  await Promise.allSettled(workers.map((worker) => worker.close()));
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

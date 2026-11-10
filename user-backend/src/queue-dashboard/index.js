import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';
import express from 'express';
import config from '@configs/app.config.js';

const connection = {
  host: config.get('redis.host'),
  port: config.get('redis.port'),
  password: config.get('redis.password') || undefined,
  maxRetriesPerRequest: null
};

const queue = new Queue('mandi-trips', { connection });
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(queue)],
  serverAdapter
});

const app = express();
app.use('/admin/queues', serverAdapter.getRouter());
app.get('/', (_req, res) => res.redirect('/admin/queues'));

const server = app.listen(3007, '0.0.0.0', () => {
  console.log('BullMQ dashboard listening on port 3007');
});

async function shutdown() {
  server.close();
  await queue.close();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

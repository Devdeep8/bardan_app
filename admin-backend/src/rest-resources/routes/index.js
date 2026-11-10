import { Router } from 'express';
import apiRouter from './api/index.js';
import { performHealthCheck } from '@src/libs/healthCheck.js';

const router = Router();

router.use('/api', apiRouter);

router.get('/health-check', async (_, res) => {
  try {
    const response = await performHealthCheck();
    res.json(response);
  } catch (error) {
    res.status(503).send();
  }
});

export default router;

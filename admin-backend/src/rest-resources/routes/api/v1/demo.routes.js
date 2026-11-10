// src/rest-resources/routes/api/v1/demo.routes.js
import { Router } from 'express';
import DemoController from '@controllers/demo.controller.js';
import asyncHandler from '@src/utils/async-handler.js';
import requestValidationMiddleware from '@src/rest-resources/middlewares/requestValidation.middleware.js';
import contextMiddleware from '@src/rest-resources/middlewares/context.middleware.js';
import rateLimitMiddleware from '@src/rest-resources/middlewares/rateLimit.middleware.js';
import { validateTestSchema } from '@src/json-schemas/demo/validateTest.schema.js';

const router = Router();
router.get('/', asyncHandler(DemoController.getDemo));
router.get('/crash', asyncHandler(DemoController.getCrash));

router.post('/validate-test', requestValidationMiddleware(validateTestSchema), (req, res) => {
  res.json({ success: true, data: req.body });
});

router.post('/transaction-test', contextMiddleware(true), asyncHandler(DemoController.transactionTest));

router.get('/rate-limit-test', rateLimitMiddleware({ points: 10, duration: 60, keyPrefix: 'demo_strict' }), (req, res) => {
  res.json({ success: true, message: 'You have not exceeded the rate limit yet!' });
});

export default router;

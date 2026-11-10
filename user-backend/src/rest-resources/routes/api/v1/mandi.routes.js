// src/rest-resources/routes/api/v1/mandi.routes.js
// Mandi Trip routes. All booking/writing endpoints run inside a DB transaction
// (contextMiddleware(true)) so the conditional booked_bori updates commit atomically.
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import asyncHandler from '@src/utils/async-handler.js';
import contextMiddleware from '@src/rest-resources/middlewares/context.middleware.js';
import isMandiUserAuthenticated from '@src/rest-resources/middlewares/isMandiUserAuthenticated.middleware.js';
import requestValidationMiddleware from '@src/rest-resources/middlewares/requestValidation.middleware.js';
import {
  MandiAuthController, MandiReferenceController,
  MandiTripController, MandiBookingController, MandiLocationController
} from '@controllers/mandi.controller.js';
import {
  requestOtpSchema, verifyOtpSchema, firebaseLoginSchema, updateMeSchema, createVehicleSchema,
  createTripSchema, updateTripSchema, tripIdParamSchema, repeatTripSchema, listTripsSchema,
  createBookingSchema, updateBookingSchema, bookingIdParamSchema, markPaymentSchema,
  postLocationSchema, locationParamSchema, reportMandiStatusSchema, mandiIdParamSchema
} from '@src/json-schemas/mandi/mandi.schema.js';

const router = Router();

// OTP endpoints are open but rate-limited (per IP) — brute force protection
const otpLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
// location writes are frequent by design; generous limit per driver
const locationLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

const auth = isMandiUserAuthenticated();

// ---- Auth ----
router.post('/auth/otp/request', otpLimiter, contextMiddleware(false), requestValidationMiddleware(requestOtpSchema), asyncHandler(MandiAuthController.requestOtp));
router.post('/auth/otp/verify', otpLimiter, contextMiddleware(false), requestValidationMiddleware(verifyOtpSchema), asyncHandler(MandiAuthController.verifyOtp));
router.post('/auth/firebase', otpLimiter, contextMiddleware(false), requestValidationMiddleware(firebaseLoginSchema), asyncHandler(MandiAuthController.firebaseLogin));
router.post('/auth/otp/logout', contextMiddleware(false), auth, asyncHandler(MandiAuthController.logout));
router.get('/me', contextMiddleware(false), auth, asyncHandler(MandiAuthController.me));
router.patch('/me', contextMiddleware(true), auth, requestValidationMiddleware(updateMeSchema), asyncHandler(MandiAuthController.updateMe));

// ---- Reference data ----
router.get('/villages', contextMiddleware(false), auth, asyncHandler(MandiReferenceController.villages));
router.get('/mandis', contextMiddleware(false), auth, asyncHandler(MandiReferenceController.mandis));
router.post('/vehicles', contextMiddleware(true), auth, requestValidationMiddleware(createVehicleSchema), asyncHandler(MandiReferenceController.createVehicle));
router.get('/vehicles', contextMiddleware(false), auth, asyncHandler(MandiReferenceController.listVehicles));

// ---- Mandi gate status ----
router.post('/mandis/:mandiId/status', contextMiddleware(true), auth, requestValidationMiddleware(reportMandiStatusSchema), asyncHandler(MandiReferenceController.reportStatus));
router.get('/mandis/:mandiId/status', contextMiddleware(false), auth, requestValidationMiddleware(mandiIdParamSchema), asyncHandler(MandiReferenceController.getStatus));

// ---- Trips ----
router.post('/trips', contextMiddleware(true), auth, requestValidationMiddleware(createTripSchema), asyncHandler(MandiTripController.create));
router.get('/trips', contextMiddleware(false), auth, requestValidationMiddleware(listTripsSchema), asyncHandler(MandiTripController.list));
router.get('/trips/mine', contextMiddleware(false), auth, asyncHandler(MandiTripController.mine));
router.post('/trips/repeat', contextMiddleware(true), auth, requestValidationMiddleware(repeatTripSchema), asyncHandler(MandiTripController.repeat));
router.get('/trips/:id', contextMiddleware(false), auth, requestValidationMiddleware(tripIdParamSchema), asyncHandler(MandiTripController.get));
router.patch('/trips/:id', contextMiddleware(true), auth, requestValidationMiddleware(updateTripSchema), asyncHandler(MandiTripController.update));
router.post('/trips/:id/cancel', contextMiddleware(true), auth, requestValidationMiddleware(tripIdParamSchema), asyncHandler(MandiTripController.cancel));
router.post('/trips/:id/start', contextMiddleware(true), auth, requestValidationMiddleware(tripIdParamSchema), asyncHandler(MandiTripController.start));
router.post('/trips/:id/end', contextMiddleware(true), auth, requestValidationMiddleware(tripIdParamSchema), asyncHandler(MandiTripController.end));
router.get('/trips/:tripId/bookings', contextMiddleware(false), auth, requestValidationMiddleware(locationParamSchema), asyncHandler(MandiTripController.bookings));

// ---- Bookings ----
router.post('/trips/:tripId/bookings', contextMiddleware(true), auth, requestValidationMiddleware(createBookingSchema), asyncHandler(MandiBookingController.create));
router.get('/me/bookings', contextMiddleware(false), auth, asyncHandler(MandiBookingController.mine));
router.patch('/bookings/:id', contextMiddleware(true), auth, requestValidationMiddleware(updateBookingSchema), asyncHandler(MandiBookingController.update));
router.post('/bookings/:id/cancel', contextMiddleware(true), auth, requestValidationMiddleware(bookingIdParamSchema), asyncHandler(MandiBookingController.cancel));
router.patch('/bookings/:id/payment', contextMiddleware(true), auth, requestValidationMiddleware(markPaymentSchema), asyncHandler(MandiBookingController.markPayment));

// ---- Live location ----
router.post('/trips/:tripId/location', locationLimiter, contextMiddleware(true), auth, requestValidationMiddleware(postLocationSchema), asyncHandler(MandiLocationController.post));
router.get('/trips/:tripId/location', contextMiddleware(false), auth, requestValidationMiddleware(locationParamSchema), asyncHandler(MandiLocationController.get));

export default router;

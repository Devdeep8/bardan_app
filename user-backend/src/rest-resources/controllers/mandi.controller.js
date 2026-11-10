// src/rest-resources/controllers/mandi.controller.js
// Mandi Trip endpoints — delegates to handlers, mirrors the CRM controller style.
import { sendResponse } from '@src/helpers/response.helpers.js';
import {
  RequestOtpHandler, VerifyOtpHandler, FirebaseLoginHandler, GetMeHandler, UpdateMeHandler
} from '@src/services/mandi/auth.handler.js';
import {
  CreateTripHandler, ListTripsHandler, GetTripHandler, ListMyTripsHandler,
  RepeatLastTripHandler, UpdateTripHandler, CancelTripHandler, StartTripHandler, EndTripHandler
} from '@src/services/mandi/trip.handler.js';
import {
  CreateBookingHandler, UpdateBookingHandler, CancelBookingHandler,
  ListMyBookingsHandler, ListTripBookingsHandler, MarkBookingPaymentHandler
} from '@src/services/mandi/booking.handler.js';
import { PostLocationHandler, GetLocationHandler } from '@src/services/mandi/location.handler.js';
import {
  ListVillagesHandler, ListMandisHandler, CreateVehicleHandler, ListVehiclesHandler,
  ReportMandiStatusHandler, GetMandiStatusHandler
} from '@src/services/mandi/mandi.handler.js';

class MandiAuthController {
  static async requestOtp(req, res, next) {
    const result = await RequestOtpHandler.execute({ ...req.body }, req.context);
    sendResponse({ req, res, next }, result, 'OTP भेज दिया गया');
  }
  static async verifyOtp(req, res, next) {
    const result = await VerifyOtpHandler.execute({ ...req.body }, req.context);
    // long-lived httpOnly cookie so the farmer stays logged in on this device
    res.cookie('mandi_access_token', result.token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/', maxAge: result.expiresIn * 1000
    });
    sendResponse({ req, res, next }, result, 'लॉगिन सफल');
  }
  static async firebaseLogin(req, res, next) {
    const result = await FirebaseLoginHandler.execute({ ...req.body }, req.context);
    res.cookie('mandi_access_token', result.token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/', maxAge: result.expiresIn * 1000
    });
    sendResponse({ req, res, next }, result, 'लॉगिन सफल');
  }
  static async logout(req, res, next) {
    res.clearCookie('mandi_access_token', {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });
    sendResponse({ req, res, next }, { loggedOut: true }, 'लॉगआउट हो गया');
  }
  static async me(req, res, next) {
    const result = await GetMeHandler.execute({}, req.context);
    sendResponse({ req, res, next }, result, 'Profile');
  }
  static async updateMe(req, res, next) {
    const result = await UpdateMeHandler.execute({ ...req.body }, req.context);
    sendResponse({ req, res, next }, result, 'Profile updated');
  }
}

class MandiReferenceController {
  static async villages(req, res, next) {
    sendResponse({ req, res, next }, await ListVillagesHandler.execute({}, req.context), 'Villages');
  }
  static async mandis(req, res, next) {
    sendResponse({ req, res, next }, await ListMandisHandler.execute({}, req.context), 'Mandis');
  }
  static async createVehicle(req, res, next) {
    sendResponse({ req, res, next }, await CreateVehicleHandler.execute({ ...req.body }, req.context), 'Vehicle added');
  }
  static async listVehicles(req, res, next) {
    sendResponse({ req, res, next }, await ListVehiclesHandler.execute({}, req.context), 'Vehicles');
  }
  static async reportStatus(req, res, next) {
    sendResponse({ req, res, next }, await ReportMandiStatusHandler.execute({ ...req.params, ...req.body }, req.context), 'Report recorded');
  }
  static async getStatus(req, res, next) {
    sendResponse({ req, res, next }, await GetMandiStatusHandler.execute({ ...req.params }, req.context), 'Gate status');
  }
}

class MandiTripController {
  static async create(req, res, next) {
    sendResponse({ req, res, next }, await CreateTripHandler.execute({ ...req.body }, req.context), 'ट्रिप बन गई');
  }
  static async list(req, res, next) {
    sendResponse({ req, res, next }, await ListTripsHandler.execute({ ...req.query }, req.context), 'Trips');
  }
  static async get(req, res, next) {
    sendResponse({ req, res, next }, await GetTripHandler.execute({ ...req.params }, req.context), 'Trip');
  }
  static async mine(req, res, next) {
    sendResponse({ req, res, next }, await ListMyTripsHandler.execute({}, req.context), 'My trips');
  }
  static async repeat(req, res, next) {
    sendResponse({ req, res, next }, await RepeatLastTripHandler.execute({ ...req.body }, req.context), 'ट्रिप दोहराई गई');
  }
  static async update(req, res, next) {
    sendResponse({ req, res, next }, await UpdateTripHandler.execute({ ...req.params, ...req.body }, req.context), 'Trip updated');
  }
  static async cancel(req, res, next) {
    sendResponse({ req, res, next }, await CancelTripHandler.execute({ ...req.params }, req.context), 'ट्रिप रद्द कर दी गई');
  }
  static async start(req, res, next) {
    sendResponse({ req, res, next }, await StartTripHandler.execute({ ...req.params }, req.context), 'ट्रिप शुरू — ट्रैकिंग चालू');
  }
  static async end(req, res, next) {
    sendResponse({ req, res, next }, await EndTripHandler.execute({ ...req.params }, req.context), 'ट्रिप पूरी हुई');
  }
  static async bookings(req, res, next) {
    sendResponse({ req, res, next }, await ListTripBookingsHandler.execute({ ...req.params }, req.context), 'Bookings');
  }
}

class MandiBookingController {
  static async create(req, res, next) {
    sendResponse({ req, res, next }, await CreateBookingHandler.execute({ ...req.params, ...req.body }, req.context), 'बुकिंग हो गई');
  }
  static async update(req, res, next) {
    sendResponse({ req, res, next }, await UpdateBookingHandler.execute({ ...req.params, ...req.body }, req.context), 'बुकिंग बदल दी गई');
  }
  static async cancel(req, res, next) {
    sendResponse({ req, res, next }, await CancelBookingHandler.execute({ ...req.params }, req.context), 'बुकिंग रद्द कर दी गई');
  }
  static async mine(req, res, next) {
    sendResponse({ req, res, next }, await ListMyBookingsHandler.execute({}, req.context), 'My bookings');
  }
  static async markPayment(req, res, next) {
    sendResponse({ req, res, next }, await MarkBookingPaymentHandler.execute({ ...req.params, ...req.body }, req.context), 'Payment updated');
  }
}

class MandiLocationController {
  static async post(req, res, next) {
    sendResponse({ req, res, next }, await PostLocationHandler.execute({ ...req.params, ...req.body }, req.context), 'Location stored');
  }
  static async get(req, res, next) {
    sendResponse({ req, res, next }, await GetLocationHandler.execute({ ...req.params }, req.context), 'Location');
  }
}

export {
  MandiAuthController, MandiReferenceController,
  MandiTripController, MandiBookingController, MandiLocationController
};

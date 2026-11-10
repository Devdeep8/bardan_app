// src/json-schemas/mandi/mandi.schema.js
// Ajv structural input hygiene for all Mandi Trip endpoints.

const uuid = { type: 'string', format: 'uuid' };
const isoDate = { type: 'string', format: 'date-time' };

export const requestOtpSchema = {
  bodySchema: {
    type: 'object',
    required: ['phone'],
    properties: { phone: { type: 'string', minLength: 10, maxLength: 15 } }
  }
};

export const verifyOtpSchema = {
  bodySchema: {
    type: 'object',
    required: ['phone', 'otp'],
    properties: {
      phone: { type: 'string', minLength: 10, maxLength: 15 },
      otp: { type: 'string', pattern: '^[0-9]{6}$' },
      ip: { type: 'string', maxLength: 45 },
      country: { type: 'string', maxLength: 2 }
    }
  }
};

export const firebaseLoginSchema = {
  bodySchema: {
    type: 'object',
    required: ['idToken'],
    properties: {
      idToken: { type: 'string', minLength: 20 },
      ip: { type: 'string', maxLength: 45 },
      country: { type: 'string', maxLength: 2 }
    }
  }
};

export const updateMeSchema = {
  bodySchema: {
    type: 'object',
    properties: {
      name: { type: 'string', maxLength: 100 },
      role: { enum: ['farmer', 'driver'] },
      villageId: { type: ['string', 'null'], format: 'uuid' },
      villageName: { type: 'string', maxLength: 80 },
      villageNameHi: { type: 'string', maxLength: 80 },
      villageNameEn: { type: 'string', maxLength: 80 }
    }
  }
};

export const createVehicleSchema = {
  bodySchema: {
    type: 'object',
    required: ['type', 'capacityBori'],
    properties: {
      type: { enum: ['tractor', 'tempo'] },
      capacityBori: { type: 'integer', minimum: 1, maximum: 2000 },
      maxWeightKg: { type: ['integer', 'null'], minimum: 1 },
      numberPlate: { type: 'string', maxLength: 20 }
    }
  }
};

export const createTripSchema = {
  bodySchema: {
    type: 'object',
    required: ['vehicleId', 'mandiId', 'villageIds', 'departsAt', 'capacityBori', 'ratePerBori'],
    properties: {
      vehicleId: uuid,
      mandiId: uuid,
      villageIds: { type: 'array', items: uuid, minItems: 1, maxItems: 10 },
      departsAt: isoDate,
      bookingCutoffAt: isoDate,
      capacityBori: { type: 'integer', minimum: 1, maximum: 2000 },
      ratePerBori: { type: 'integer', minimum: 0, maximum: 100000 }
    }
  }
};

export const updateTripSchema = {
  paramsSchema: { type: 'object', required: ['id'], properties: { id: uuid } },
  bodySchema: {
    type: 'object',
    properties: {
      departsAt: isoDate,
      bookingCutoffAt: isoDate,
      capacityBori: { type: 'integer', minimum: 1, maximum: 2000 },
      ratePerBori: { type: 'integer', minimum: 0, maximum: 100000 }
    }
  }
};

export const tripIdParamSchema = {
  paramsSchema: { type: 'object', required: ['id'], properties: { id: uuid } }
};

export const repeatTripSchema = {
  bodySchema: { type: 'object', properties: { departsAt: isoDate } }
};

export const listTripsSchema = {
  querySchema: {
    type: 'object',
    properties: {
      villageId: uuid,
      date: { type: 'string', format: 'date' }
    }
  }
};

export const createBookingSchema = {
  paramsSchema: { type: 'object', required: ['tripId'], properties: { tripId: uuid } },
  bodySchema: {
    type: 'object',
    required: ['villageId', 'boriCount', 'crop'],
    properties: {
      villageId: uuid,
      boriCount: { type: 'integer', minimum: 1, maximum: 2000 },
      crop: { enum: ['soybean', 'wheat', 'garlic', 'other'] }
    }
  }
};

export const updateBookingSchema = {
  paramsSchema: { type: 'object', required: ['id'], properties: { id: uuid } },
  bodySchema: {
    type: 'object',
    required: ['boriCount'],
    properties: { boriCount: { type: 'integer', minimum: 1, maximum: 2000 } }
  }
};

export const bookingIdParamSchema = {
  paramsSchema: { type: 'object', required: ['id'], properties: { id: uuid } }
};

export const markPaymentSchema = {
  paramsSchema: { type: 'object', required: ['id'], properties: { id: uuid } },
  bodySchema: { type: 'object', required: ['paymentStatus'], properties: { paymentStatus: { enum: ['unpaid', 'paid'] } } }
};

export const postLocationSchema = {
  paramsSchema: { type: 'object', required: ['tripId'], properties: { tripId: uuid } },
  bodySchema: {
    type: 'object',
    required: ['lat', 'lng'],
    properties: {
      lat: { type: 'number', minimum: -90, maximum: 90 },
      lng: { type: 'number', minimum: -180, maximum: 180 },
      accuracy: { type: ['number', 'null'] },
      speed: { type: ['number', 'null'] },
      recordedAt: isoDate
    }
  }
};

export const locationParamSchema = {
  paramsSchema: { type: 'object', required: ['tripId'], properties: { tripId: uuid } }
};

export const reportMandiStatusSchema = {
  paramsSchema: { type: 'object', required: ['mandiId'], properties: { mandiId: uuid } },
  bodySchema: { type: 'object', required: ['status'], properties: { status: { enum: ['open', 'closed', 'long_queue'] } } }
};

export const mandiIdParamSchema = {
  paramsSchema: { type: 'object', required: ['mandiId'], properties: { mandiId: uuid } }
};

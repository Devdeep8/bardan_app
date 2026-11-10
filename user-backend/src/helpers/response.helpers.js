// src/helpers/response.helpers.js
import { AppError } from '@src/errors/app.error.js';
import Errors from '@src/errors/errorCodes.js';
import platform from '@src/utils/platform.js';
import _ from 'lodash';

export const sendResponse = ({ req, res, next }, data, message = 'success') => {
  const locale = req?.platform?.locale || 'en';
  const timezone = req?.platform?.timezone || 'UTC';
  res.payload = {
    success: true,
    message: (req?.platform?.t ? req.platform.t(message) : message),
    data,
    timestamp: platform.datetime.format(new Date(), 'YYYY-MM-DD HH:mm:ss', timezone)
  };
  res.json(res.payload);
};




const extractErrorAttributes = (errors) => Array.isArray(errors) ? errors : Object.keys(errors || {});
const errorTypes = {};

export const sendSocketResponse = ({ reqData, resCallback }, { successful, result, serviceErrors, defaultError }) => {
  if (successful && !_.isEmpty(result)) {
    return resCallback({ data: result, errors: [] });
  } else {
    if (!_.isEmpty(serviceErrors)) {
      const responseErrors = extractErrorAttributes(serviceErrors).map(errorAttr => errorTypes[errorAttr] || errorAttr);
      return resCallback({ data: {}, errors: responseErrors });
    }
    const responseError = new AppError(Errors.INTERNAL_ERROR, { ...defaultError });
    return resCallback({ data: {}, errors: [responseError] });
  }
};

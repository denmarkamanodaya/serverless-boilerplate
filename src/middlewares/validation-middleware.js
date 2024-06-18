/* eslint-disable class-methods-use-this */
const Joi = require('joi');
const httpStatus = require('http-status');
const { pick } = require('../utils/pick');
const { httpResponseCodes } = require('../common/response-codes');
const { JoiValidation } = require('../utils/custom-errors/class-errors');
const logger = require('../common/logger');

module.exports = (schema) => ({
  before: async (request) => {
    if (!schema) return;

    const { event } = request;

    const object = pick(event, Object.keys(schema));

    const { error, value } = Joi.compile(schema)
      .prefs({ errors: { label: 'key' }, abortEarly: false })
      .validate(object);

    Object.keys(value).forEach((key) => (event[key] = value[key]));

    if (error) {
      logger.info(error.details, 'JOI VALIDATION ERROR DETAILS');
      throw new JoiValidation(error.message, httpResponseCodes.DATA_PROCESSING_ERROR.value, httpStatus.BAD_REQUEST);
    }
  },
});

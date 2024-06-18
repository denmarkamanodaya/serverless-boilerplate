const Joi = require('joi');
const httpStatus = require('http-status');
const { pick } = require('../utils/pick');
const { errorResponse } = require('../services/aws/api-gateway-resp-util');
const { httpResponseCodes } = require('../utils/response-codes');
const { JoiValidation } = require('../utils/custom-errors/class-errors');

class CustomMiddleWare {
  schemaValidation(schema) {
    return {
      before: async (request) => {
        const { event } = request;

        if (!event?.queryStringParameters) {
          event.queryStringParameters = {};
        }

        // Convert params from pathParameters as params is only recognized by Joi
        // And being handled from pick event below
        if (event?.pathParameters) {
          event.params = event.pathParameters;
        }

        const validSchema = pick(schema, ['body', 'queryStringParameters', 'pathParameters', 'params', 'headers']);
        const object = pick(event, Object.keys(validSchema));

        const { error } = Joi.compile(validSchema)
          .prefs({ errors: { label: 'key' }, abortEarly: false })
          .validate(object);

        if (error) {
          throw new JoiValidation(error.message, httpResponseCodes.DATA_PROCESSING_ERROR.value, httpStatus.BAD_REQUEST);
        }
      },
    };
  }

  handleMiddleWareError() {
    return {
      onError: async (request) => {
        const { error } = request;

        request.response = errorResponse(error);

        return request.response;
      },
    };
  }
}

module.exports = new CustomMiddleWare();

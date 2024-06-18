/* eslint-disable no-param-reassign */
/* eslint-disable security/detect-unsafe-regex */
const httpStatus = require('http-status');
const { httpResponseCodes } = require('../common/response-codes');
const { APP_REFERENCES } = require('../common/constants');
const logger = require('../common/logger');

module.exports = () => {
  let requestId;
  const allowedOrigin = APP_REFERENCES?.CORS_ORIGIN ?? '*';

  const isJSON = (headers) => {
    const contentTypeHeader = headers['Content-Type'] ?? headers['content-type'];
    return /^application\/(.+\+)?json($|;.+)/.test(contentTypeHeader);
  };

  const generateResponse = ({ statusCode, headers = {}, code, data }) => {
    const responseHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
      ...headers,
    };

    return {
      headers: responseHeaders,
      statusCode,
      body: isJSON(responseHeaders)
        ? JSON.stringify({
            status: statusCode,
            requestId,
            code,
            data,
          })
        : data,
    };
  };

  return {
    before: async ({ event }) => {
      requestId = event.requestContext.requestId;

      const { headers, body, isBase64Encoded } = event;

      if (isJSON(headers)) {
        try {
          const data = isBase64Encoded ? Buffer.from(body, 'base64').toString() : body;
          event.body = JSON.parse(data);
        } catch (e) {
          const err = new Error('Invalid or malformed JSON was provided');
          err.code = httpStatus.UNSUPPORTED_MEDIA_TYPE.value;
          err.statusCode = httpStatus.UNSUPPORTED_MEDIA_TYPE;
          throw err;
        }
      }
    },

    after: async ({ response }) => {
      const { code, data, headers } = response;
      const statusCode = httpStatus.OK;
      return generateResponse({ statusCode, headers, code, data });
    },

    onError: async ({ error }) => {
      const { statusCode: sc, code: c, message } = error;
      const statusCode = sc || httpStatus.INTERNAL_SERVER_ERROR;
      const code = c || httpResponseCodes.INTERNAL_SERVER_ERROR.value;

      logger.error(error);

      return generateResponse({ statusCode, code, data: { message } });
    },
  };
};

const httpStatus = require('http-status');
const logger = require('../../common/logger');

module.exports.success = (data, code) => {
  const statusCode = httpStatus.OK;
  return {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
    },
    statusCode,
    body: JSON.stringify({
      status: statusCode,
      code,
      data,
    }),
  };
};

module.exports.errorResponse = (error) => {
  let { statusCode, code, parent: err } = error;
  const { message, msg } = error;
  let responseMessage = message || msg;

  statusCode = statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  code = code || 'INTERNAL_SERVER_ERROR';
  err = err || error;

  if (error.response) {
    // support getting error response from limit service
    const result = error.response.data;
    responseMessage = result.error.message;
    code = result.code;
    statusCode = result.status;
  }
  logger.error(err);

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      status: statusCode,
      code,
      data: { message: responseMessage },
    }),
  };
};

module.exports.to = (promise) => promise.then((data) => [null, data]).catch((err) => [err]);

module.exports.end = (err, data, code) => {
  if (err) {
    return this.errorResponse(err);
  }

  return this.success(data, code);
};

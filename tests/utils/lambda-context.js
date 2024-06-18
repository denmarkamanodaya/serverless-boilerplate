const { randomUUID } = require('crypto');

module.exports = (body = {}, pathParameters = {}, queryStringParameters = {}, headers = {}) => ({
  event: {
    body,
    pathParameters,
    queryStringParameters,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },

    requestContext: {
      requestId: randomUUID(),
    },
  },
});

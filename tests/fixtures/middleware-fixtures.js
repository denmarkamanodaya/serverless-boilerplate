/* eslint-disable newline-per-chained-call */
const Joi = require('joi');

const requestBody = {
  error: {
    event: {
      queryStringParameters: {
        page: 'invalid',
        limit: 200,
      },
      pathParameters: {
        id: 'invalid',
      },
    },
  },

  success: {
    event: {
      queryStringParameters: {
        page: 1,
        limit: 50,
      },
      pathParameters: {
        id: 123,
      },
    },
  },

  noQueryString: {
    event: {
      pathParameters: {
        id: 123,
      },
    },
  },
};

const schema = {
  error: {
    body: {
      name: Joi.string().required(),
    },
    queryStringParameters: {
      page: Joi.number().integer().min(1).required(),
      limit: Joi.number().integer().min(1).max(100).required(),
    },
    pathParameters: {
      id: Joi.number().integer().required(),
    },
  },

  success: {
    body: {
      name: Joi.string().required(),
    },
    queryStringParameters: {
      page: Joi.number().integer().min(1).required(),
      limit: Joi.number().integer().min(1).max(100).required(),
    },
    pathParameters: {
      id: Joi.number().integer().required(),
    },
  },

  noQueryString: {
    pathParameters: {
      id: Joi.number().integer().required(),
    },
  },
};

const middleware = {
  response: {
    statusCode: 200,
    body: 'valid',
  },

  event: {
    body: {},
    method: 'GET',
  },
};

module.exports = { requestBody, schema, middleware };

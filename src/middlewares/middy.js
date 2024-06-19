const middyCore = require('@middy/core');
const httpHeaderNormalizer = require('@middy/http-header-normalizer');
const requestResponseMiddleware = require('./request-response-middleware');
const validationMiddleware = require('./validation-middleware');
// const verifyTokenMiddleware = require('./verify-token-middleware');

module.exports.defaultMiddleware = (fn, schema) => middyCore(fn)
  .use(httpHeaderNormalizer())
  .use(requestResponseMiddleware())
  .use(validationMiddleware(schema));

// module.exports.authVerifyMiddleware = (lambdafn, validationSchema, header) => middyCore(lambdafn)
//   .use(httpHeaderNormalizer())
//   .use(requestResponseMiddleware())
//   .use(validationMiddleware(validationSchema))
//   .use(verifyTokenMiddleware(header));

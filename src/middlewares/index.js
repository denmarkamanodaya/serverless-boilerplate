const middyCore = require('@middy/core');
const httpHeaderNormalizer = require('@middy/http-header-normalizer');
const httpBodyParser = require('@middy/http-json-body-parser');
const customMiddleWare = require('./custom-middleware');

module.exports = (fn, schema) => {
  return middyCore(fn)
    .use(httpHeaderNormalizer())
    .use(httpBodyParser())
    .use(customMiddleWare.schemaValidation(schema))
    .use(customMiddleWare.handleMiddleWareError());
};

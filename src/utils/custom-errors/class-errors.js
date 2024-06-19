/* eslint-disable max-classes-per-file */
const BaseCustomError = require('./base-error');

class JoiValidation extends BaseCustomError {
  name = this.constructor.name;

  stack = `Joi Validation ${this.stack}`;
}
class Boilerplate extends BaseCustomError {
  name = this.constructor.name;

  stack = `Boilerplate ${this.stack}`;
}

module.exports = {
  JoiValidation,
  Boilerplate,
};

class BaseCustomError extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = BaseCustomError;

const BaseCustomError = require('./base-error');

class JoiValidation extends BaseCustomError {
  name = this.constructor.name;

  stack = `Joi Validation ${this.stack}`;
}
class IamError extends BaseCustomError {
  name = this.constructor.name;

  stack = `IAM Service ${this.stack}`;
}

class UserMigrationError extends BaseCustomError {
  name = this.constructor.name;

  stack = `User Migration Service ${this.stack}`;
}

class JWTError extends BaseCustomError {
  name = this.constructor.name;

  stack = `JWT Service ${this.stack}`;
}

class MFAError extends BaseCustomError {
  name = this.constructor.name;

  stack = `MFA Service ${this.stack}`;
}

class OrchestrationError extends BaseCustomError {
  name = this.constructor.name;

  stack = `Orchestration Service ${this.stack}`;
}

class UserRegError extends BaseCustomError {
  name = this.constructor.name;
  stack = `User Registration Service ${this.stack}`;
}

class RequestSchemaError extends BaseCustomError {
  name = this.constructor.name;
  stack = `Request Schema Error ${this.stack}`;
}

class WSO2Error extends BaseCustomError {
  name = this.constructor.name;
  stack = `WSO2 Service ${this.stack}`;
}

class KMSError extends BaseCustomError {
  name = this.constructor.name;
  stack = `KMS Service ${this.stack}`;
}

class OnboardingServiceError extends BaseCustomError {
  name = this.constructor.name;
  stack = `Onboarding Service ${this.stack}`;
}

module.exports = {
  JoiValidation,
  IamError,
  UserMigrationError,
  JWTError,
  MFAError,
  OrchestrationError,
  UserRegError,
  RequestSchemaError,
  WSO2Error,
  KMSError,
  OnboardingServiceError,
};

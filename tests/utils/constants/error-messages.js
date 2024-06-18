const JOI_VALIDATION_TEST_ERRORS = {
  INVALID_NOTIFICATION_PARAMS: '"type" must be one of [sms, email]',
  INVALID_INFOBIP_WEBHOOK_PARAMS: '"results" does not contain 1 required value(s). "results" must contain at least 1 items',
  DEVICE_ENROLLMENT_TOKEN_ERROR: '"x-device-enrollment-token" is required. "x-ud-device-id" is required',
  DEVICE_ENROLLMENT_OTP_ERROR: '"otp" is required. "otpId" is required',
  DEVICE_ENROLLMENT_IN_APP_OTP_ERROR: '"inAppOtp" is required',
  DEVICE_ENROLLMENT_UNENROLLMENT_DEVICE_ID_ERROR: '"deviceId" is required. "fake-deviceId" is not allowed',
  DEVICE_ENROLLMENT_DEVICE_ID_HEADER_ERROR: '"x-ud-device-id" is required',
  DEVICE_ENROLLMENT_CONFIRATION_HEADER_ERROR: '"x-device-enrollment-token" is required. "x-ud-device-id" is required',
  MISSING_SESSION_DEVICE_ENROLLMENT_PARAMS: '\"x-ud-device-make-model\" is required. \"x-ud-device-id\" is required',
  MISSING_SESSION_DEVICE_ENROLLMENT_DEVICE_MODEL: '\"x-ud-device-make-model\" is required',
  MISSING_SESSION_DEVICE_ENROLLMENT_DEVICE_ID: '\"x-ud-device-id\" is required',
  MISSING_SESSION_DEVICE_ENROLLMENT_TOKEN: '\"x-device-enrollment-token\" is required. \"x-ud-device-id\" is required',
  MISSING_SESSION_DEVICE_ENROLLMENT_DEVICE_TOKEN: '\"x-device-enrollment-token\" is required',
  MISSING_AUTHORIZATION: '\"authorization\" is required',
  EMPTY_AUTHORIZATION: '\"authorization\" is not allowed to be empty',
  AUTHORIZATION_MUST_STRING: '\"authorization\" must be a string',
  MISSING_CONFIRMATION_PARAMS: '\"authorization\" is required. \"x-device-confirmation-token\" is required',
  MISSING_CONFIRMATION_TOKEN: '\"x-device-confirmation-token\" is required',
  EMPTY_AUTH_CONFIRMATION_TOKEN: '\"authorization\" is not allowed to be empty. \"x-device-confirmation-token\" is not allowed to be empty',
  INTEGER_AUTH_AND_CONFIRMATION_TOKEN: '\"authorization\" must be a string. \"x-device-confirmation-token\" must be a string',
  MISSING_AUTH_DEVICE_ENROLLMENT_TOKEN_PARAMS: '\"authorization\" is required. \"x-device-enrollment-token\" is required',
  EMPTY_AUTH_DEVICE_ENROLLMENT_TOKEN: '\"authorization\" is not allowed to be empty. \"x-device-enrollment-token\" is not allowed to be empty',
  INTEGER_AUTH_DEVICE_ENROLLMENT_TOKEN: '\"authorization\" must be a string. \"x-device-enrollment-token\" must be a string',
  MISSING_ANSWER_CHALLENGE_BODY_PARAMS: '\"otpId\" is required. \"otp\" is required',
  MISSING_OTPID_BODY_PARAMS: '\"otpId\" is required',
  MISSING_OTP_BODY_PARAMS: '\"otp\" is required',
  INTEGER_OTPID_OTP_BODY_PARAMS: '\"otpId\" must be a string. \"otp\" must be a string',
  MISSING_INAPP_OTP_BODY_PARAMS: '\"inAppOtp\" is required',
  EMPTY_INAPP_OTP_BODY_PARAMS: '\"inAppOtp\" is not allowed to be empty',
  INTEGER_INAPP_OTP_BODY_PARAMS: '\"inAppOtp\" must be a string',
  MISSING_DEVICE_ID_PATH_PARAMS: '\"deviceId\" is required',
  EMPTY_DEVICE_ID_PATH_PARAMS: '\"deviceId\" is not allowed to be empty',
  INTEGER_DEVICE_ID_PATH_PARAMS: '\"deviceId\" must be a string',
  MISSING_AUTH_UD_DEVICE_ID_PARAMS: '\"authorization\" is required. \"x-ud-device-id\" is required',
  EMPTY_AUTH_UD_DEVICE_ID_TOKEN: '\"authorization\" is not allowed to be empty. \"x-ud-device-id\" is not allowed to be empty',
  INTEGER_AUTH_UD_DEVICE_ID_PARAMS: '\"authorization\" must be a string. \"x-ud-device-id\" must be a string',

};

const AXIOS_ERRORS = {
  FAILED_REQUEST: 'Error: Network Error',
  NETWORK_ERROR: 'Network Error',
};

const TEMPLATE_ERRORS = {
  GET_OBJECT_FAILED: 'S3 get object failed',
  COMPILATION_FAILED: '"otp" not defined in [object Object] - 1:34',
};

const MAIL_ERRORS = {
  SEND_EMAIL_FAILED:
    'Message failed: 554 Message rejected: Email address is not verified. The following identities failed the check in region AP-SOUTHEAST-1: christian.miranda@collabera.com, UDBank DEV <christian.miranda@collabera.com>',
};

module.exports = {
  AXIOS_ERRORS,
  TEMPLATE_ERRORS,
  JOI_VALIDATION_TEST_ERRORS,
  MAIL_ERRORS,
};

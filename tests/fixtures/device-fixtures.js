const deviceParameters = {
    missingParameter: {},
    emptyAuthorization: {
        authorization: ''
    },
    integerAuth: {
        authorization: 1
    },
    expectingAuthorization: {
        authorization: 'this is auth'
    },
    missingParameterAuth: {
        'x-device-confirmation-token': 'confirm token'
    },
    emptyBothAuthxConfirmationToken: {
        authorization: '',
        'x-device-confirmation-token': ''
    },
    emptyAuthorizationInConfirmationToken: {
        authorization: '',
        'x-device-confirmation-token': 'this is auth'
    },
    emptyConfirmationToken: {
        authorization: 'this is auth',
        'x-device-confirmation-token': ''
    },
    integerBothAuthorizationAndConfirmationToken: {
        authorization: 1,
        'x-device-confirmation-token': 1
    },
    expectAuthandConfirmationToken: {
        authorization: 'this is auth',
        'x-device-confirmation-token': ' confirm token'
    },
    missingParameterAuthIniateOTPChallenge: {
        'x-device-enrollment-token': 'enrollmentToken'
    },
    emptyParameterAuthIniateOTPChallenge: {
        'x-device-enrollment-token': '',
        authorization: ''
    },
    integerParameterAuthIniateOTPChallenge: {
        'x-device-enrollment-token': 1,
        authorization: 1
    },
    expectParameterAuthIniateOTPChallenge: {
        'x-device-enrollment-token': 'enrollmentToken',
        authorization: 'this is auth'
    },
    missingOtpId: {
        otp: '123141'
    },
    missingOtp: {
        otpId: '1'
    },
    integerOtpIDandOTP: {
        otpId: 1,
        otp: 112312
    },
    otpIdandOtp: {
        otp: '123141',
        otpId: '1'
    },
    emptyInAppOtp: {
        inAppOtp: ''
    },
    integerInAppOtp: {
        inAppOtp: 123,
    },
    expectInAppOtp: {
        inAppOtp: '1234'
    },

    emptyDeviceId: {
        deviceId: ''
    },
    integerDeviceId: {
        deviceId: 123,
    },
    expectDeviceId: {
        deviceId: '1234'
    },
    missingAuthTOTPValidate: {
        'x-ud-device-id': 'ABC123'
    },
    emptyAuthTOTPValidate: {
        authorization: '',
        'x-ud-device-id': ''
    },
    integerAuthTOTPValidate: {
        authorization: 123,
        'x-ud-device-id': 123
    },
    expectTOTPValidate: {
        authorization: 'this is auth',
        'x-ud-device-id': 'XDEVICEID'
    }

  };
  
  module.exports = { deviceParameters };
  
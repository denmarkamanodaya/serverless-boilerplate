module.exports.requestPasswordResetData = {
  headers: {
    'x-rttm-session-id': 'rttmSessionId',
    'x-rttm-web-session-id': 'rttmWebSessionId',
    'x-rttm-app-version': 'rttmAppVersion',
    'x-rttm-agent': 'rttmAgent',
    // 'x-original-forwarded-for': 'originalForwardFor',
  },
  body: {
    // mobileNumber: '639150626709'
    mobileNumber: '639940149127',
  },
};

module.exports.mobileNumberDoestNotExists = {
  status: 500,
  requestId: '4a621921-c6e0-451e-b60f-70c9bf424830',
  code: 'DATA_PROCESSING_ERROR',
  data: {
    message: 'Mobile number does not exists.',
  },
};

module.exports.getCustomerByMobileResponse = {
  data: {
    id: 707,
    cid: 'abccb1f9-5f46-4842-aac7-0c8278703dee',
    stakeholderId: '8477267259000622096',
    firstName: 'Test',
    middleName: 'test',
    lastName: 'test',
    createdAt: '2023-07-19T08:59:41.854Z',
    updatedAt: '2023-07-27T07:26:35.005Z',
    customerDetails: {
      id: 650,
      customerId: 707,
    },
  },
};

module.exports.getCustomerByMobileResponseWithoutCID = {
  data: {
    id: 707,
    cid: '',
    stakeholderId: '8477267259000622096',
    firstName: 'Test',
    middleName: 'test',
    lastName: 'test',
    createdAt: '2023-07-19T08:59:41.854Z',
    updatedAt: '2023-07-27T07:26:35.005Z',
    customerDetails: {
      id: 650,
      customerId: 707,
    },
  },
};

module.exports.resetPasswordRequestBody = {
  method: 'POST',
  headers: {
    'x-rttm-session-id': 'rttmSessionId',
    'x-rttm-web-session-id': 'rttmWebSessionId',
    'x-rttm-app-version': 'rttmAppVersion',
    'x-rttm-agent': 'rttmAgent'
  },
  body: {
    // mobileNumber: '639150626709',
    mobileNumber: '639923709893',
    password: 'password',
    // passowrd: 'unitTest!123',
    token: 'b5ecff91-6fda-4d1f-9e0e-f13fb1f81b2a',
    otp: '111111'
  }
};
module.exports.ddbOtpNewData = {
  dataset: 'ud_customer_otp',
  sort_key: '639150626709|342512|b5ecff91-6fda-4d1f-9e0e-f13fb1f81b2a',
  purpose: 'purpose',
  otp: 'otp',
  is_used: false,
  duration: null,
  country_code: null,
  transaction_id: null,
  mfa_token: null,
  validity_until: null,
  created_at: null,
  updated_at: null,
};

module.exports.constVarPassword = {
  passwordHash: '43b0427c96ff99dfd003db88f5fc6340d1e1eb3d55b02b3fe6514991c0a6a939b8901c35196f1baddee054474fac68c0c836751b39238422e0cca202ca974d5b',
  newPasswordHash: 'eaf4f3045357e74352ffecd6c8c78b5e00b3475c5ba79750f0b3fb59d78212892183936d35a4663f923f4d07bd1493da198e46240602cee79acfd30820e45c0b'
};

module.exports.changePasswordRequestBody = {
  method: 'POST',
  headers: {
    'x-rttm-session-id': 'rttmSessionId',
    'x-rttm-web-session-id': 'rttmWebSessionId',
    'x-rttm-app-version': 'rttmAppVersion',
    'x-rttm-agent': 'rttmAgent'
  },
  body: {
    username: '639923709893',
    // password: 'pAss@1234',
    password: 'oldPassword',
    newPassword: 'pAss@1234',
  }
}
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { HEADER_AUTH, IK_UD_CUSTOMER_SERVICE } = require('../../common/constants');
const { Users, Devices } = require('../../models/index');
const { IamError } = require('../../utils/custom-errors/class-errors');
const httpStatus = require('http-status');
const { httpResponseCodes } = require('../../utils/response-codes');
const { AxiosInterceptor } = require('../../common/axios-interceptor');
const { udCustomerAxiosConfig } = require('../../common/axios-config');

const { axiosInstance } = new AxiosInterceptor(udCustomerAxiosConfig);

const ecdsaHelper = async (type, dataStr, mode) => {
  try {
    // Get public key
    let response2;
    if (mode == 'SMS') {
      const config2 = {
        method: 'get',
        url: `${IK_UD_CUSTOMER_SERVICE.HOST}/api/r1/community/${IK_UD_CUSTOMER_SERVICE.COMMUNITY_NAME}/publickeys`,
        headers: {
          'X-TenantTag': IK_UD_CUSTOMER_SERVICE.TENANT_TAG,
        },
      };
      response2 = await axios(config2);
    } else {
      response2 = await axios.get(`${IK_UD_CUSTOMER_SERVICE.HOST}/users-mgmt/publickeys`);
    }

    console.log('MODE: ', mode, ' SYSTEM_PUBLIC_KEYS: ', response2.data);
    const systemPublicKey = response2.data.publicKey;

    const response = await axios.post(
      `${IK_UD_CUSTOMER_SERVICE.HOST}/users-mgmt/ecdsa_helper/${type}`,
      {
        publicKey: systemPublicKey,
        privateKey: IK_UD_CUSTOMER_SERVICE.PRIVATE_KEY,
        dataStr,
      },
      { 'Content-Type': HEADER_AUTH.ACCEPT }
    );
    return response.data.data;
  } catch (error) {
    await _error(error);
  }
};

const generateHeaders = async (mode) => {
  // Initializer
  const encryptedRequestId = await ecdsaHelper(
    'encrypt',
    JSON.stringify({
      ts: Math.round(new Date().getTime() / 1000),
      appid: 'com.postman.request',
      uuid: uuidv4(),
    }),
    mode
  );
  const encryptedLicenseKey = await ecdsaHelper('encrypt', IK_UD_CUSTOMER_SERVICE.LICENSE_KEY, mode);
  const headers = {
    headers: {
      licensekey: encryptedLicenseKey,
      requestid: encryptedRequestId,
    },
  };
  return headers;
};

module.exports.generate1KSmsOtp = async (body) => {
  try {
    const headersX = await generateHeaders('SMS');
    const payload = {
      ...body,
      ...{
        userPublicKey_: IK_UD_CUSTOMER_SERVICE.PUBLIC_KEY,
        communityId: IK_UD_CUSTOMER_SERVICE.COMMUNITY_ID,
        tenantId: IK_UD_CUSTOMER_SERVICE.TENANT_ID,
        smsTemplateB64: IK_UD_CUSTOMER_SERVICE.SMS_TEMPLATE,
        trace: IK_UD_CUSTOMER_SERVICE.SMS_TRACE,
        smsFrom: IK_UD_CUSTOMER_SERVICE.SMS_FROM,
      },
    };
    const { data } = await axiosInstance.post(`/api/r2/otp/generate`, payload, headersX);
    return data;
  } catch (error) {
    console.log(error);
    return await _error(error);
  }
};

module.exports.verifyOtp = async (body) => {
  try {
    const record = await Users.findOne({
      where: {
        membershipId: body.userId,
      },
    });

    if (Object.is(record, null)) {
      return _error({
        message: httpResponseCodes.DEVICE_NOT_TRUSTED.value,
        responseCode: httpResponseCodes.DEVICE_NOT_TRUSTED.value,
        statusCode: httpStatus.UNAUTHORIZED,
      });
    }

    // Delete/Clean JSON key before passing into 1Kosmos OTP verification
    delete body['userId'];
    body.userId = record.username;

    const headersX = await generateHeaders('SMS');
    const headersWTTag = {
      ...headersX.headers,
      ...{
        'X-TenantTag': IK_UD_CUSTOMER_SERVICE.TENANT_TAG,
        publickey: IK_UD_CUSTOMER_SERVICE.PUBLIC_KEY,
        'Content-Type': 'application/json',
      },
    };

    const payload = {
      ...body,
      ...{
        communityId: IK_UD_CUSTOMER_SERVICE.COMMUNITY_ID,
        tenantId: IK_UD_CUSTOMER_SERVICE.TENANT_ID,
      },
    };

    console.log('HEADERS: ', headersX);
    console.log('HEADERS: ', headersWTTag);
    console.log('PAYLOAD: ', payload);

    const { data } = await axios.post(`${IK_UD_CUSTOMER_SERVICE.HOST}/api/r2/otp/verify`, payload, {
      headers: headersWTTag,
    });
    return data;
  } catch (error) {
    return await _error({
      message: error.response.data.message,
      statusCode: error.response.data.error_code,
    });
  }
};

module.exports.createUser = async (body) => {
  try {
    const headersX = await generateHeaders('USER');
    const payload = {
      authModule: IK_UD_CUSTOMER_SERVICE.AUTH_MODULE,
      ...{ users: [body] },
    };
    const { data } = await axiosInstance.put(
      `/users-mgmt/tenant/${IK_UD_CUSTOMER_SERVICE.TENANT_ID}/community/${IK_UD_CUSTOMER_SERVICE.COMMUNITY_ID}/users/create`,
      payload,
      headersX
    );
    return data;
  } catch (error) {
    console.log(error);
    await _error(error);
  }
};

module.exports.getAccessToken = async (body) => {
  try {
    const headersX = await generateHeaders('SMS');
    const headersWTTag = {
      ...headersX.headers,
      ...{
        'X-TenantTag': IK_UD_CUSTOMER_SERVICE.TENANT_TAG,
        publickey: IK_UD_CUSTOMER_SERVICE.PUBLIC_KEY,
      },
    };

    // // Fetch 1K user data
    let kosmosUserData = await fetchUser(body.userId);
    kosmosUserData = kosmosUserData.data[0];

    // Main ACR payload
    const accessTokenPayload = {
      userId: body.userId,
      firstname: kosmosUserData.firstname,
      lastname: kosmosUserData.lastname,
      createdby: 'idaas',
      createdbyemail: 'idaas@example.com',
      email: kosmosUserData.email,
      version: body.version,
      authModuleId: IK_UD_CUSTOMER_SERVICE.AUTH_MODULE,
      uid: kosmosUserData.uid,
    };
    console.log(accessTokenPayload);
    const payload = await ecdsaHelper('encrypt', JSON.stringify(accessTokenPayload), 'SMS');

    const { data } = await axios.put(
      `${IK_UD_CUSTOMER_SERVICE.HOST}/api/r2/acr/community/${IK_UD_CUSTOMER_SERVICE.COMMUNITY_NAME}/code`,
      { data: payload },
      { headers: headersWTTag }
    );

    //Added for mobile redeeming process
    data.uid = kosmosUserData.uid;

    console.log(data);
    return data;
  } catch (error) {
    return await _error(error);
  }
};

const fetchUser = async (username) => {
  try {
    const headersX = await generateHeaders('USER');
    const payload = {
      authModule: IK_UD_CUSTOMER_SERVICE.AUTH_MODULE,
      ...{ query: { username: username } },
    };
    const { data } = await axiosInstance.post(
      `/users-mgmt/tenant/${IK_UD_CUSTOMER_SERVICE.TENANT_ID}/community/${IK_UD_CUSTOMER_SERVICE.COMMUNITY_ID}/users/fetch`,
      payload,
      headersX
    );
    return data;
  } catch (error) {
    return await _error(error);
  }
};

const _error = async (error) => {
  throw new IamError(
    error?.message,
    error?.responseCode ? error.responseCode : httpResponseCodes.DATA_PROCESSING_ERROR.value,
    error?.statusCode ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR
  );
};

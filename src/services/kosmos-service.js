const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { HEADER_AUTH, IK_UD_CUSTOMER_SERVICE } = require('../common/constants');
const { Users } = require('../models/index');
const { IamError } = require('../utils/custom-errors/class-errors');
const httpStatus = require('http-status');
const { httpResponseCodes } = require('../utils/response-codes');
const { AxiosInterceptor } = require('../common/axios-interceptor');
const { udCustomerAxiosConfig } = require('../common/axios-config');

class KosmosService extends AxiosInterceptor {
  constructor() {
    super(udCustomerAxiosConfig);

    this.userHeaders = null;
    this.smsHeaders = null;
  }

  async initialize() {
    [this.userHeaders, this.smsHeaders] = await Promise.all([this.generateHeaders('USER'), this.generateHeaders('SMS')]);
  }

  async ecdsaHelper(type, dataStr, mode) {
    try {
      const systemPublicKey = mode == 'SMS' ? process.env.IK_SMS_PUB_KEY : process.env.IK_UMS_PUB_KEY;

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
      await this._error(error);
    }
  }

  async generateHeaders(mode) {
    const [encryptedRequestId, encryptedLicenseKey] = await Promise.all([
      this.ecdsaHelper(
        'encrypt',
        JSON.stringify({
          ts: Math.round(new Date().getTime() / 1000),
          appid: 'com.postman.request',
          uuid: uuidv4(),
        }),
        mode
      ),
      this.ecdsaHelper('encrypt', IK_UD_CUSTOMER_SERVICE.LICENSE_KEY, mode),
    ]);

    const headers = {
      headers: {
        licensekey: encryptedLicenseKey,
        requestid: encryptedRequestId,
      },
    };
    return headers;
  }

  async verifyOtp(body) {
    try {
      const record = await Users.findOne({
        where: {
          membershipId: body.userId,
        },
      });
      if (Object.is(record, null)) {
        return this._error({
          message: httpResponseCodes.DEVICE_NOT_TRUSTED.value,
          responseCode: httpResponseCodes.DEVICE_NOT_TRUSTED.value,
          statusCode: httpStatus.UNAUTHORIZED,
        });
      }
      // Delete/Clean JSON key before passing into 1Kosmos OTP verification
      delete body['userId'];
      body.userId = record.username;
      const headersX = {
        ...this.smsHeaders.headers,
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
      const { data } = await axios.post(`${IK_UD_CUSTOMER_SERVICE.HOST}/api/r2/otp/verify`, payload, { headers: headersX });
      return data;
    } catch (error) {
      return await this._error({
        message: error.response.data.message,
        statusCode: error.response.data.error_code,
      });
    }
  }

  async createUser(body) {
    try {
      const payload = {
        authModule: IK_UD_CUSTOMER_SERVICE.AUTH_MODULE,
        ...{ users: [body] },
      };
      const { data } = await this.axiosInstance.put(
        `/users-mgmt/tenant/${IK_UD_CUSTOMER_SERVICE.TENANT_ID}/community/${IK_UD_CUSTOMER_SERVICE.COMMUNITY_ID}/users/create`,
        payload,
        this.userHeaders
      );
      return data;
    } catch (error) {
      await this._error(error);
    }
  }

  async getAccessCode(acr) {
    try {
      const payload = await this.ecdsaHelper('encrypt', JSON.stringify(acr), 'SMS');
      const headersX = {
        ...this.smsHeaders.headers,
        ...{
          'X-TenantTag': IK_UD_CUSTOMER_SERVICE.TENANT_TAG,
          publickey: IK_UD_CUSTOMER_SERVICE.PUBLIC_KEY,
        },
      };
      const { data } = await axios.put(
        `${IK_UD_CUSTOMER_SERVICE.HOST}/api/r2/acr/community/${IK_UD_CUSTOMER_SERVICE.COMMUNITY_NAME}/code`,
        { data: payload },
        { headers: headersX }
      );
      //Added for mobile redeeming process
      data.uid = acr.uid;
      return data;
    } catch (error) {
      return await this._error(error);
    }
  }

  async fetchUser(username) {
    try {
      const payload = {
        authModule: IK_UD_CUSTOMER_SERVICE.AUTH_MODULE,
        ...{ query: { username } },
      };
      const { data } = await this.axiosInstance.post(
        `/users-mgmt/tenant/${IK_UD_CUSTOMER_SERVICE.TENANT_ID}/community/${IK_UD_CUSTOMER_SERVICE.COMMUNITY_ID}/users/fetch`,
        payload,
        this.userHeaders
      );
      return data;
    } catch (error) {
      return await this._error(error);
    }
  }

  async _error(error) {
    throw new IamError(
      error?.message,
      error?.responseCode ? error.responseCode : httpResponseCodes.DATA_PROCESSING_ERROR.value,
      error?.statusCode ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

module.exports = { KosmosService };

const axios = require('axios');
const querystring = require('querystring');
const { IamError } = require('../utils/custom-errors/class-errors');
const httpStatus = require('http-status');
const { httpResponseCodes } = require('../utils/response-codes');
const { HEADER_AUTH, BAAS_GRANT_TYPE, BAAS, API_MANAGER } = require('../common/constants');

module.exports.loginv2 = async (body, type) => {
  try {
    const { username, password, mfaToken, otp } = body;
    const appId = BAAS.PUBIC_APP_ID;
    const appSecret = BAAS.PUBLIC_APP_SECRET;
    let payload = {
      grant_type: type,
      mfa_token: mfaToken,
      otp,
    };
    if (type != BAAS_GRANT_TYPE.MFA_OTP) {
      payload = {
        username,
        password,
        grant_type: type,
      };
    }
    const client = axios.create({
      auth: {
        username: appId,
        password: appSecret,
      },
      headers: {
        'Content-Type': HEADER_AUTH.FORM_URLENCODED,
      },
    });
    const { data } = await client.post(`${BAAS.BASE_URL}/oauth2/token`, querystring.stringify(payload));
    return data;
  } catch (error) {
    await _error({
      statusCode: error?.code ? httpStatus.BAD_REQUEST : null,
      responseCode: error?.code ? error.code : null,
      message: error.response.data.error_description,
    });
  }
};

module.exports.temporaryAccessNotif = async (body) => {
  try {
    const normalizedPayload = {
      grant_type: 'client_credentials',
      client_id: BAAS.IAM_APP_ID,
      client_secret: BAAS.IAM_APP_SECRET,
      // username: body.username,
      // password: body.password,
    };
    const client = axios.create({
      headers: {
        'Content-Type': HEADER_AUTH.FORM_URLENCODED,
      },
    });
    const { data } = await client.post(`${BAAS.BASE_URL}/oauth2/token`, querystring.stringify(normalizedPayload));
    return data;
  } catch (error) {
    return await _error(error);
  }
};

module.exports.temporaryAccessPublic = async (body) => {
  try {
    const normalizedPayload = {
      grant_type: 'password',
      client_id: BAAS.PUBIC_APP_ID,
      client_secret: BAAS.PUBLIC_APP_SECRET,
      username: body.username,
      password: body.password,
    };
    const client = axios.create({
      headers: {
        'Content-Type': HEADER_AUTH.FORM_URLENCODED,
      },
    });
    const { data } = await client.post(`${BAAS.BASE_URL}/oauth2/token`, querystring.stringify(normalizedPayload));
    return data;
  } catch (error) {
    return await _error(error);
  }
};

module.exports.membershipData = async (token) => {
  try {
    const config = {
      method: 'get',
      url: `${API_MANAGER.BASE_URL}/membership-service/${process.env.BAAS_MEMBERSHIP_VERSION}/users/me`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const { data } = await axios(config);
    return data;
  } catch (error) {
    return await this._error(error);
  }
};

module.exports.sendNewLoginNotification = async (token, membershipData, device) => {
  try {
    // Traverse to email address
    const { contacts, firstName, middleName, lastName, mobileNumber } = membershipData.data;
    const contactData = contacts;
    let primaryEmail = null;
    contactData.forEach(function (contact) {
      if (contact.contactType == 'EMAIL' && contact.isPrimary == true) {
        primaryEmail = contact.contactValue;
      }
    });

    // Return error if there has no email address on user account
    if (primaryEmail == null) {
      primaryEmail = '';
    }

    const payload = {
      additionalData: {
        customer: {
          firstName,
          middleName,
          lastName,
          deviceInfo: device,
        },
      },
      templateName: process.env.BAAS_NEW_DEVICE_LOGIN_TEMPLATE,
      entityId: process.env.BAAS_NEW_DEVICE_LOGIN_TEMPLATE_ENTITY_ID,
      email: primaryEmail,
      phone: mobileNumber,
      appId: process.env.BAAS_NEW_DEVICE_LOGIN_TEMPLATE_APP_ID,
    };

    const config = {
      method: 'post',
      url: `${API_MANAGER.BASE_URL}/notification-service/1.0.0/notifications`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify(payload),
    };

    const { status } = await axios(config);
    return status;
  } catch (error) {
    return await this._error(error);
  }
};

const _error = (error) => {
  throw new IamError(
    error?.message,
    error?.responseCode ? error.responseCode : httpResponseCodes.DATA_PROCESSING_ERROR.value,
    error?.statusCode ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR
  );
};

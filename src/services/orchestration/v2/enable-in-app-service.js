const { KosmosService } = require('../../kosmos-service');
const { UserManagementService } = require('../../user-management-service');
const { DeviceService } = require('../../device-service');

const { Users, Devices } = require('../../../models/index');

const { IK_UD_CUSTOMER_SERVICE } = require('../../../common/constants');
const { httpResponseCodes } = require('../../../utils/response-codes');
const logger = require('../../../utils/logger');
const httpStatus = require('http-status');
const { OrchestrationError } = require('../../../utils/custom-errors/class-errors');
const { MfaService } = require('../../mfa-service');

const udUserOnboardingService = require('../../ud-user-onboarding/user-onboarding-service');

const { JWT } = require('../../jwt-service');
const { UdNotificationService } = require('../../notification-service/notification-service');
const ns = new UdNotificationService();

class EnableInAppOrchestrationService {
  constructor(data) {
    this.accessToken = data;
    this.userProfile = null;
    this.kosmosUser = null;
    this.body = null;

    this.jwtService = new JWT();
    this.kosmos = new KosmosService();
    this.device = new DeviceService();
    this.user = new UserManagementService();

    this.kosmosInit = null;
  }

  async initialize() {
    const user = await this.jwtService.verify({ token: this.accessToken });

    [this.kosmosInit, this.userProfile] = await Promise.all([
      this.kosmos.initialize(),
      this.getCustomerDetails(user.mobileNumber),
    ]);

    this.kosmosUser = await this.geteKosmosUser();
  }

  async startFlow(body, flowType) {
    switch (flowType) {
      case 'generate-sms-otp':
        return this.generateSmsOtpFlow(body);

      case 'validate-sms-otp':
        return this.validateSmsOtpFlow(body);

      case 'generate-access-code':
        return this.generateAccessCodeFlow(body);

      case 'trust-the-device':
        return this.trustDeviceFlow(body).then((data) => {
          return this.resolvex(data);
        });

      case 'disable-trusted-device':
        return this.untrustDeviceFlow(body).then((data) => {
          return this.resolvex(data);
        });

      case 'resolve':
        return this.resolvex();

      default:
        return await this._error({
          statusCode: httpStatus.UNAUTHORIZED,
          responseCode: 'UNKNOWN_FLOW',
          message: 'UNKNOWN_FLOW',
        });
    }
  }

  async resolvex(data) {
    const sleep = async (milliseconds) => {
      await new Promise((resolve) => {
        return setTimeout(resolve, milliseconds);
      });
    };

    await sleep(500);

    return data;
  }

  async generateAccessCodeFlow(body) {
    if (!body.hasOwnProperty('kosmosDid')) {
      return this._error({
        statusCode: httpStatus.BAD_REQUEST,
        message: '"kosmosDid" is required',
      });
    }
    if (!body.hasOwnProperty('version')) {
      return this._error({
        statusCode: httpStatus.BAD_REQUEST,
        message: '"version" is required',
      });
    }
    this.body = body;

    await Users.update(
      {
        userDid: body.kosmosDid,
        updatedBy: body.userId,
      },
      {
        where: { username: this.userProfile.mobileNumber },
      }
    );

    const accessCode = await this.generateAccessCode();
    logger.info(`[generate-access-code] | ${this.userProfile.mobileNumber} | ${JSON.stringify(accessCode)}`);
    return {
      link: accessCode.link,
      code: accessCode.code,
      uid: accessCode.uid,
    };
  }

  async untrustDeviceFlow(body) {
    if (!body.hasOwnProperty('deviceId')) {
      return this._error({
        statusCode: httpStatus.BAD_REQUEST,
        message: '"deviceId" is required',
      });
    }

    this.body = body;

    const data = await Users.findOne({
      where: {
        username: this.userProfile.mobileNumber,
      },
      include: [
        {
          model: Devices,
          where: {
            mobileInstanceId: body.deviceId,
          },
        },
      ],
    });

    if (!data) {
      return await this._error({
        message: httpResponseCodes.DEVICE_NOT_OWNED.value,
      });
    }

    const makeModel = data.Devices[0].makeModel;

    if (makeModel) {
      const payload = {
        template: process.env.NOTIFICATION_SERVICE_TOGGLE_OFF_TEMPLATE_NAME,
        first_name: this.userProfile.firstName,
        make_model: makeModel,
        mobileNumber: this.userProfile.mobileNumber,
        email: this.userProfile.emailAddress,
      };

      await Promise.all([ns.sendSms(payload), ns.send(payload)]);
    }

    // Untrust all trusted devices
    await Devices.update(
      {
        trusted: 0,
        updatedBy: this.userProfile.consumerId,
      },
      {
        where: { userId: data.id },
      }
    );

    logger.info(`[disable-trusted-device] | ${this.userProfile.mobileNumber} | DEVICE_MAKE_MODEL: ${makeModel}`);

    return httpResponseCodes.DEVICE_HAS_BEEN_UNTRUSTED.value;
  }

  async trustDeviceFlow(body) {
    if (!body.hasOwnProperty('deviceId')) {
      return this._error({
        statusCode: httpStatus.BAD_REQUEST,
        message: '"deviceId" is required',
      });
    }

    this.body = body;

    const data = await Users.findOne({
      where: {
        username: this.userProfile.mobileNumber,
      },
      include: [
        {
          model: Devices,
          where: {
            mobileInstanceId: body.deviceId,
          },
        },
      ],
    });

    if (!data) {
      return await this._error({
        message: httpResponseCodes.DEVICE_NOT_OWNED.value,
      });
    }

    const makeModel = data.Devices[0].makeModel;

    if (makeModel) {
      const payload = {
        template: process.env.NOTIFICATION_SERVICE_TOGGLE_ON_TEMPLATE_NAME,
        first_name: this.userProfile.firstName,
        make_model: makeModel,
        mobileNumber: this.userProfile.mobileNumber,
        email: this.userProfile.emailAddress,
      };

      await Promise.all([ns.sendSms(payload), ns.send(payload)]);
    }

    // Untrust all trusted devices
    await Devices.update(
      {
        trusted: 0,
        updatedBy: this.userProfile.consumerId,
      },
      {
        where: { userId: data.id },
      }
    );

    // Trust single device
    await Devices.update(
      {
        trusted: 1,
        inAppOtpEnabled: 1,
        updatedBy: this.userProfile.consumerId,
      },
      {
        where: { userId: data.id, mobileInstanceId: body.deviceId },
      }
    );

    logger.info(`[trust-the-device] | ${this.userProfile.mobileNumber} | DEVICE_MAKE_MODEL: ${makeModel}`);

    return httpResponseCodes.DEVICE_HAS_BEEN_TRUSTED.value;
  }

  async generateSmsOtpFlow() {
    return this.generateSmsOtp();
  }

  async validateSmsOtpFlow(body) {
    if (!body.hasOwnProperty('otp')) {
      return this._error({
        statusCode: httpStatus.BAD_REQUEST,
        message: '"otp" is required',
      });
    }
    if (!body.hasOwnProperty('otpId')) {
      return this._error({
        statusCode: httpStatus.BAD_REQUEST,
        message: '"otpId" is required',
      });
    }
    this.body = body;
    return this.validateSmsOtp();
  }

  async generateSmsOtp() {
    const mfa = new MfaService();
    const payload = {
      username: this.userProfile.mobileNumber,
      purpose: 'MOBILE_NO_VERIFICATION',
      template: process.env.NOTIFICATION_SERVICE_TOGGLE_ON_OTP_TEMPLATE_NAME,
    };
    const data = await mfa.otps(payload);
    return data;
  }

  async validateSmsOtp() {
    const mfa = new MfaService();
    const data = await mfa.verify({
      token: this.body.otpId,
      otp: this.body.otp,
      mobileNumber: this.userProfile.mobileNumber,
    });
    return data;
  }

  async generateAccessCode() {
    try {
      const payload = {
        userId: this.userProfile.mobileNumber,
        firstname: this.kosmosUser.data[0].firstname,
        lastname: this.kosmosUser.data[0].lastname,
        createdby: 'idaas',
        createdbyemail: 'idaas@example.com',
        email: this.kosmosUser.data[0].email,
        version: this.body.version,
        authModuleId: IK_UD_CUSTOMER_SERVICE.AUTH_MODULE,
        uid: this.kosmosUser.data[0].uid,
      };
      logger.info(`[generate-access-code] | ${this.userProfile.mobileNumber} | ${JSON.stringify(payload)}`);
      return await this.kosmos.getAccessCode(payload);
    } catch (error) {
      return await this._error(error);
    }
  }

  async geteKosmosUser() {
    try {
      return await this.kosmos.fetchUser(this.userProfile.mobileNumber);
    } catch (error) {
      return await this._error(error);
    }
  }

  async getCustomerDetails(mobileNumber) {
    try {
      const { data } = await udUserOnboardingService.getCustomerByMobile(mobileNumber);

      const { customerDetails } = data;

      logger.info(`[customer-details] | ${JSON.stringify(customerDetails)}`);

      return {
        customerId: customerDetails.customerId,
        mobileNumber: mobileNumber.length < 12 ? `${mobileNumberAreaCode}${mobileNumber}` : mobileNumber,
        emailAddress: customerDetails.emailAddress,
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
      };
    } catch (error) {
      return await this._error(error);
    }
  }

  async _error(error) {
    throw new OrchestrationError(
      error?.message,
      error?.responseCode ? error.responseCode : httpResponseCodes.DATA_PROCESSING_ERROR.value,
      error?.statusCode ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

module.exports = { EnableInAppOrchestrationService };

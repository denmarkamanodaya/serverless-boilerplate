const httpStatus = require('http-status');
const { Users, Devices } = require('../models/index');
const { IamError } = require('../utils/custom-errors/class-errors');
const { httpResponseCodes } = require('../common/response-codes');

module.exports.checkTrustedDevices = async (body) => {
  try {
    const { userId: uid } = body;
    const whereCondition = { membershipId: uid };
    const include = [
      {
        model: Devices,
        where: {
          trusted: 1,
        },
      },
    ];
    const userRecord = await Users.findOne({ where: whereCondition, include });
    if (Object.is(userRecord, null)) {
      return _error({
        message: httpResponseCodes.RECORD_NOT_FOUND.value,
        responseCode: httpResponseCodes.RECORD_NOT_FOUND.value,
        statusCode: httpStatus.NOT_FOUND,
      });
    }
    return userRecord;
  } catch (error) {
    await _error(error);
  }
};

module.exports.checkTrustedDevice = async (pathParameters) => {
  try {
    const { deviceId, mobileNumber } = pathParameters;
    const userRecordSpecificOrList = await this._getRecord({ deviceId, mobileNumber });
    const errorObj = {
      message: httpResponseCodes.RECORD_NOT_FOUND.value,
      statusCode: httpStatus.NOT_FOUND,
    };

    if (Object.is(userRecordSpecificOrList, null)) {
      errorObj.responseCode = httpResponseCodes.DEVICE_NOT_TRUSTED.value;
      return _error(errorObj);
    }
    if (!userRecordSpecificOrList.length && !deviceId) {
      errorObj.responseCode = httpResponseCodes.HAS_NO_TRUSTED_DEVICE.value;
      return _error(errorObj);
    }
    if (!deviceId) {
      return {
        message: httpResponseCodes.HAS_TRUSTED_DEVICE.value,
        devices: userRecordSpecificOrList[0].Devices,
      };
    }
    return userRecordSpecificOrList;
  } catch (error) {
    if (error.response?.data) {
      return await _error({
        message: httpResponseCodes.DEVICE_NOT_TRUSTED.value,
        responseCode: httpResponseCodes.DEVICE_NOT_TRUSTED.value,
        statusCode: httpStatus.UNAUTHORIZED,
      });
    }
  }
};

module.exports.checkIfDeviceExistsV2 = async (pathParameters) => {
  try {
    const whereCondition = { mobileInstanceId: pathParameters.deviceId };
    const deviceRecord = await Devices.findOne({ where: whereCondition });
    if (Object.is(deviceRecord, null)) {
      return _error({
        message: httpResponseCodes.RECORD_NOT_FOUND.value,
        responseCode: httpResponseCodes.RECORD_NOT_FOUND.value,
        statusCode: httpStatus.NOT_FOUND,
      });
    }
    return deviceRecord;
  } catch (error) {
    await _error(error);
  }
};

module.exports.checkIfDeviceIsTrusted = async (body) => {
  try {
    const { userDid: userDeviceId, deviceId, userId } = body;
    const whereCondition = { membershipId: userId };
    const include = [
      {
        model: Devices,
        where: {
          mobileInstanceId: userDeviceId || deviceId,
          trusted: 1,
        },
      },
    ];
    const userRecord = await Users.findOne({ where: whereCondition, include });
    if (Object.is(userRecord, null)) {
      return _error({
        responseCode: httpResponseCodes.DEVICE_NOT_TRUSTED.value,
        message: httpResponseCodes.RECORD_NOT_FOUND.value,
        statusCode: httpStatus.NOT_FOUND,
      });
    }
    return userRecord;
  } catch (error) {
    return _error(error);
  }
};

module.exports._getRecord = async ({ deviceId, mobileNumber }) => {
  const whereCondition = { username: mobileNumber };
  const includeItem = {
    model: Devices,
    where: {
      trusted: 1,
    },
  };
  if (deviceId) {
    includeItem.where.mobileInstanceId = deviceId;
    return Users.findOne({
      where: whereCondition,
      include: [includeItem],
    });
  }
  return Users.findAll({
    where: whereCondition,
    include: [includeItem],
  });
};
// For deprecation
module.exports.checkIfDeviceExists = async (body) => {
  try {
    const { userId, deviceId } = body;
    const whereCondition = { membershipId: userId };
    const include = [
      {
        model: Devices,
        where: {
          mobileInstanceId: deviceId,
        },
      },
    ];
    const userRecord = await Users.findOne({ where: whereCondition, include });

    if (Object.is(rec, null)) {
      return _error({
        message: httpResponseCodes.RECORD_NOT_FOUND.value,
        responseCode: httpResponseCodes.RECORD_NOT_FOUND.value,
        statusCode: httpStatus.NOT_FOUND,
      });
    }
    return userRecord;
  } catch (error) {
    await _error(error);
  }
};

module.exports.trustUntrustDevice = async (body, pathParameters) => {
  try {
    const { tag, userId: uid } = body;
    if (tag) {
      return this.checkTrustedDevices(body);
    }
    // If tagging not presented, proceed to trusting or untrusting
    const rec2 = await Users.findOne({
      where: { membershipId: body.userId },
    });
    const r2WhereCondition = { where: { userId: rec2.id, trusted: 1 } };
    const currentTrustedDevice = await Devices.findOne(r2WhereCondition);
    delete r2WhereCondition.where.trusted;
    const rData = {
      trusted: pathParameters.type == 'yes' ? 1 : 0,
      updatedBy: body.userId,
    };
    const rec = await Devices.update(rData, r2WhereCondition).then(() => currentTrustedDevice);
    return rec;
  } catch (error) {
    await _error(error);
  }
};

module.exports.enableInAppOtp = async (body) => {
  try {
    const { userId, makeModel, deviceId } = body;
    const userRecord = await Users.findOne({
      where: { membershipId: userId },
    });
    const deviceObj = {
      inAppOtpEnabled: 1,
      makeModel,
      trusted: 1,
      updatedBy: uid,
    };
    const whereCondition = { where: { userId: userRecord.id, mobileInstanceId: deviceId } };
    return await Devices.update(deviceObj, whereCondition);
  } catch (error) {
    await _error(error);
  }
};

const _error = async (error) => {
  throw new IamError(
    error?.message,
    error?.responseCode ? error.responseCode : httpResponseCodes.DATA_PROCESSING_ERROR.value,
    error?.statusCode ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR
  );
};

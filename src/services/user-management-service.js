const { Users } = require('../models/index');
const { IamError } = require('../utils/custom-errors/class-errors');
const { httpResponseCodes } = require('../utils/response-codes');
const { UdIdaService } = require('../services/ida-service/ida-service');
const { BLOCKED_LIST_USER } = require('../common/constants');
const httpStatus = require('http-status');
const logger = require('../utils/logger');
const ida = new UdIdaService();

module.exports.createUserV2 = async (data) => {
  try {
    const [user, created] = await Users.findOrCreate({
      where: {
        username: data.username,
        membershipId: data?.membershipId ? data.membershipId : null,
      },
    });

    this.createKosmosUser(data);

    const result = await ida.getByUsername(`${data.username}`);

    if (result?.message === 'No user/s found') {
      logger.debug(`no user found for ${data.username} creating IDA user`);
      await ida.createUserV2({ username: `+${data.username}` });
    }

    if (!created) {
      return await _error({
        message: httpResponseCodes.USER_EXIST.value,
        responseCode: httpResponseCodes.USER_EXIST.value,
        statusCode: httpStatus.CONFLICT,
      });
    }
    return user;
  } catch (error) {
    await _error(error);
  }
};

module.exports.checkIfUserExists = async (body) => {
  try {
    const rec = await Users.findOne({
      where: {
        membershipId: body.userId,
      },
    });
    if (Object.is(rec, null)) {
      return _error({
        message: httpResponseCodes.USER_DOES_NOT_EXIST.value,
        responseCode: httpResponseCodes.USER_DOES_NOT_EXIST.value,
        statusCode: httpStatus.NOT_FOUND,
      });
    }
    return rec;
  } catch (error) {
    return await _error(error);
  }
};

module.exports.checkIfUserExistsV2 = async (pathParameters) => {
  try {
    const rec = await Users.findOne({
      where: {
        username: pathParameters.username,
      },
      attributes: { exclude: ['password', 'salt'] },
    });
    if (Object.is(rec, null)) {
      return _error({
        message: httpResponseCodes.USER_DOES_NOT_EXIST.value,
        responseCode: httpResponseCodes.USER_DOES_NOT_EXIST.value,
        statusCode: httpStatus.NOT_FOUND,
      });
    }
    return rec;
  } catch (error) {
    return await _error(error);
  }
};

module.exports.checkIfUserExistsV3 = async (pathParameters) => {
  try {
    const rec = await Users.findOne({
      where: {
        username: pathParameters.username,
      },
      attributes: { exclude: ['password', 'salt'] },
    });

    if (Object.is(rec, null)) {
      return false;
    }

    return true;
  } catch (error) {
    return await _error(error);
  }
};

module.exports.updateMembership = async (data) => {
  await Users.update(
    {
      membershipId: data.customerId,
      updatedBy: data.customerId,
    },
    {
      where: { username: data.username },
    }
  );
};
module.exports.getUserStatus = async (pathParameters) => {
  try {
    const user = await Users.findOne({ where: { username: pathParameters.username } });
    if (!user) {
      await _error({
        message: httpResponseCodes.USER_DOES_NOT_EXIST.value,
        responseCode: httpResponseCodes.USER_DOES_NOT_EXIST.value,
        statusCode: httpStatus.NOT_FOUND,
      });
    }

    if (user.isActive === false) {
      await _error({
        message: httpResponseCodes.USER_LOCKED.value,
        responseCode: httpResponseCodes.USER_LOCKED.value,
        statusCode: httpStatus.LOCKED,
      });
    }

    return httpResponseCodes.USER_ACTIVE.value;
  } catch (error) {
    return await _error(error);
  }
};

module.exports.setUserStatus = async (pathParameters) => {
  try {
    const { customerId, status } = pathParameters;
    const user = await Users.findOne({ where: { membershipId: customerId } });

    if (!user) {
      return await _error({
        message: httpResponseCodes.USER_DOES_NOT_EXIST.value,
        responseCode: httpResponseCodes.USER_DOES_NOT_EXIST.value,
        statusCode: httpStatus.NOT_FOUND,
      });
    }

    user.isActive = status === 'revoke' ? 0 : 1;
    await user.save();

    return status === 'revoke' ? httpResponseCodes.USER_LOCKED.value : httpResponseCodes.USER_ACTIVE.value;
  } catch (error) {
    await _error(error);
  }
};

module.exports.healthCheck = async () => {
  return 'OK';
};

// Hotfix: 07-12-2023
module.exports.checkIfUserIsBlocked = async (mobileNumber) => {
  const list = BLOCKED_LIST_USER;
  // If in list return error
  if (list.includes(mobileNumber)) {
    return _error({
      message: httpResponseCodes.INTERNAL_SERVER_ERROR.value,
      responseCode: httpResponseCodes.INTERNAL_SERVER_ERROR.value,
      statusCode: httpStatus.SERVICE_UNAVAILABLE,
    });
  }
};

const _error = async (error) => {
  throw new IamError(
    error?.message,

    // Solves the vague error returning DATA_PROCESSING error constantly
    error?.responseCode ? error.responseCode : error?.code ? error.code : httpResponseCodes.DATA_PROCESSING_ERROR.value,
    error?.statusCode ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR
  );
};

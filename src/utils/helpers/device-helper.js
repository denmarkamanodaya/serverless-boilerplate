const { Devices } = require('../../models/index');
const { Op } = require('sequelize');

module.exports.isDevicExistAndNotOwned = async ({ authUserId, deviceId }) => {
  const res = await Devices.findOne({
    where: {
      mobileInstanceId: deviceId,
      trusted: 1,
      userId: {
        [Op.ne]: authUserId,
      },
    },
  });
  return res == null;
};

module.exports.associateDevice = async ({ authUserId, deviceId, deviceMakeModel }) => {
  const [_, isCreated] = await Devices.findOrCreate({
    where: {
      userId: authUserId,
      mobileInstanceId: deviceId,
    },
    defaults: {
      makeModel: deviceMakeModel,
      trusted: 0,
      inAppOtpEnabled: 0,
      createdBy: authUserId,
    },
  });

  return isCreated;
};

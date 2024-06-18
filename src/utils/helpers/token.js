const { UserSessions } = require('../../models/index');
module.exports.invalidateSession = async (accessToken) =>
  UserSessions.update({ isValid: false }, { where: { accessToken } });

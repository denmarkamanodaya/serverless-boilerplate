const { UserSessions, Users } = require('../models/index');
const moment = require('moment');

module.exports.getSession = async (data) => {
  return await UserSessions.findOne({
    where: { ...data },
  });
};

module.exports.createSession = async (data) => {
  return await UserSessions.create({
    ...data,
    datetime: moment().format(),
    isValid: true,
  });
};

module.exports.updateSession = async (data) => {
  const { username, attributes } = data;
  const { id } = await Users.findOne({ where: { username } });
  return await UserSessions.update(
    { ...attributes },
    {
      where: { userId: id },
    }
  );
};

module.exports.updateSessionByToken = async (data) => {
  const { accessToken } = data;
  return await UserSessions.update(
    { isValid: false },
    {
      where: { accessToken },
    }
  );
};

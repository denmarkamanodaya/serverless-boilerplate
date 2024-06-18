const { Users } = require('../../models/index');
const { generateSalt, generatePasswordHash } = require('./password-helper');

module.exports.getUser = async (data) => {
  const { username } = data;
  return await Users.findOne({
    where: {
      username,
    },
  });
};

module.exports.migrateUser = async (data) => {
  const { username, password } = data;
  const whereCondition  = {where: { username }, defaults: {username, isActive: true}};
  // handling for no password user createion eg. request password reset
  if (password) {
    const salt = await generateSalt();
    const passwordHash = await generatePasswordHash({ salt, password });
    whereCondition.defaults  = {
      salt,
      password: passwordHash,
    };
  }
  const [user] = await Users.findOrCreate(whereCondition);
  return user;
};

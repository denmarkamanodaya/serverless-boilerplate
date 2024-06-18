const { revokeToken } = require('../../utils/helpers/session-helper');

module.exports.logout = async (data) => {
  const { token } = data.body;
  return revokeToken({ token });
};

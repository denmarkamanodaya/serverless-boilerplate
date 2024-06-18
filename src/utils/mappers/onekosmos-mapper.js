const { IK_UD_CUSTOMER_SERVICE } = require('../../common/constants');

module.exports.userMapper = (username) => ({
  username,
  password: `${Math.random().toString(36).slice(-10)}$!`,
  status: 'active',
  firstname: 'firstname',
  lastname: 'lastname',
  email1: `${username}@ud-${process.env.NODE_ENV}.com`,
  email1_verified: false,
  phone1: username,
  phone1_verified: true,
  address: {},
  address_verified: false,
  disabled: false,
});

module.exports.accessCodeMapper = (body) => {
  const { username: userId, version, firstname, lastname, email, uid } = body;
  return {
    userId,
    firstname,
    lastname,
    createdby: 'idaas',
    createdbyemail: 'idaas@example.com',
    email,
    version,
    authModuleId: IK_UD_CUSTOMER_SERVICE.AUTH_MODULE,
    uid,
  };
};

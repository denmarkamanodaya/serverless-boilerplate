// const moment = require('moment');
// const { JWT_CONFIG } = require('../../common/constants');
// const { kmsSignv2, kmsVerifyv2 } = require('../../utils/aws/kms');

// const header = {
//   alg: JWT_CONFIG.HEADER_ALG,
//   typ: JWT_CONFIG.HEADER_TYP,
// };

// module.exports.sign = async (payload) => {
//   const jwtHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
//   const jwtPayload = Buffer.from(
//     JSON.stringify({
//       iat: moment().unix(),
//       exp: moment().add(JWT_CONFIG.TOKEN_DURATION, JWT_CONFIG.TIME_FORMAT).unix(),
//       ...payload,
//     })
//   ).toString('base64url');

//   const signature = await kmsSignv2({
//     KeyId: JWT_CONFIG.KMS_KEY,
//     Message: Buffer.from(`${jwtHeader}.${jwtPayload}`),
//     SigningAlgorithm: JWT_CONFIG.ALGO,
//     MessageType: JWT_CONFIG.MESSAGE_TYPE,
//   });

//   return `${jwtHeader}.${jwtPayload}.${Buffer.from(signature).toString('base64url')}`;
// };

// module.exports.verify = async (data) => {
//   const [header, payload, signature] = data.split('.');
//   const isVerified = await kmsVerifyv2({
//     KeyId: JWT_CONFIG.KMS_KEY,
//     Message: Buffer.from(`${header}.${payload}`),
//     SigningAlgorithm: JWT_CONFIG.ALGO,
//     MessageType: JWT_CONFIG.MESSAGE_TYPE,
//     Signature: Buffer.from(signature, 'base64url'),
//   });

//   return isVerified && !this.isExpired(data);
// };

// module.exports.decode = (data) => {
//   const [_, payload] = data.split('.');
//   return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
// };

// module.exports.isExpired = (data) => {
//   const { exp } = this.decode(data);
//   return moment().unix() > exp;
// };

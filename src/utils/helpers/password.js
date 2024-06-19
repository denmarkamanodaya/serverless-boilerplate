// const { kmsGenerateRandom } = require('../../utils/aws/kms');
// const { PASSWORD_CONFIG, USER_MIGRATION_CONFIG } = require('../../common/constants');
// const crypto = require('crypto');
// const { authServiceResponseCodes } = require('../../utils/response-codes');
// const { Users } = require('../../models/index');

// module.exports.generateSalt = async () => {
//   return await kmsGenerateRandom({
//     bytes: PASSWORD_CONFIG.NUMBER_OF_BYTES,
//     keyId: USER_MIGRATION_CONFIG.KMS_KEY,
//   });
// };

// module.exports.generatePasswordHash = (data) => {
//   const { salt, password } = data;
//   const hash = crypto.pbkdf2Sync(
//     password,
//     salt,
//     PASSWORD_CONFIG.ITERATIONS,
//     PASSWORD_CONFIG.KEY_LENGTH,
//     PASSWORD_CONFIG.DIGEST
//   );
//   return hash.toString('hex');
// };

// module.exports.validatePasswordCriteria = ({ password }) => {
//   const hasValidLength = password.length >= 8;
//   const hasNumber = /[0-9]/.test(password);
//   const hasUppercase = /[A-Z]/.test(password);
//   const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);

//   return hasValidLength && hasNumber && hasUppercase && hasSpecialChar;
// };
// module.exports.validatePassword = ({ inputRawPassword, actualPasswordHash, salt }) => {
//   const currentPasswordToVerifyHash = this.generatePasswordHash({ salt, password: inputRawPassword });
//   return currentPasswordToVerifyHash === actualPasswordHash;
// };

// module.exports.updateUserPassword = async ({ username, newPassword }) => {
//   const generatedSalt = await this.generateSalt();
//   const generatedPasswordHash = this.generatePasswordHash({ salt: generatedSalt, password: newPassword });

//   await Users.update(
//     {
//       salt: generatedSalt,
//       password: generatedPasswordHash,
//     },
//     {
//       where: { username },
//     }
//   );
//   return { message: authServiceResponseCodes.PASSWORD_UPDATED.value, code: authServiceResponseCodes.PASSWORD_UPDATED.value };
// };

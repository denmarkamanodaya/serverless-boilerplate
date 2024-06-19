// const { KMSClient, GenerateRandomCommand, SignCommand, VerifyCommand } = require('@aws-sdk/client-kms');

// const { httpResponseCodes, jwtResponseCodes } = require('../../common/response-codes');
// const { KMSError } = require('../custom-errors/class-errors');
// const httpStatus = require('http-status');

// const awsConfig = {
//   // region: process.env.AWS_SECRETS_MANAGER_REGION,
//   endpoint: 'http://localhost:4566',
// };

// const kmsClient = new KMSClient(awsConfig);

// module.exports.kmsGenerateRandom = async (data) => {
//   const command = new GenerateRandomCommand({
//     NumberOfBytes: data.bytes,
//   });

//   const { Plaintext } = await kmsClient.send(command);

//   return Buffer.from(Plaintext).toString('base64');
// };

// module.exports.kmsSign = async (data) => {
//   const command = new SignCommand({
//     KeyId: data.keyId,
//     Message: data.message,
//     SigningAlgorithm: data.algo,
//     MessageType: data.type,
//   });

//   return await kmsClient.send(command);
// };

// module.exports.kmsVerify = async (data) => {
//   const command = new VerifyCommand({
//     KeyId: data.keyId,
//     Message: data.message,
//     SigningAlgorithm: data.algo,
//     MessageType: data.type,
//     Signature: data.signature,
//   });

//   const { SignatureValid } = await kmsClient.send(command);

//   return SignatureValid;
// };

// //-----------------------------------------------------------

// module.exports.kmsSignv2 = async (data) => {
//   try {
//     const command = new SignCommand(data);
//     const { Signature } = await kmsClient.send(command);
//     return Signature;
//   } catch (e) {
//     throw new KMSError(
//       httpResponseCodes.ERROR_PROCESSING.value,
//       httpResponseCodes.ERROR_PROCESSING.value,
//       httpStatus.INTERNAL_SERVER_ERROR
//     );
//   }
// };

// module.exports.kmsVerifyv2 = async (data) => {
//   try {
//     const command = new VerifyCommand(data);
//     const { SignatureValid } = await kmsClient.send(command);
//     return SignatureValid;
//   } catch (e) {
//     throw new KMSError(jwtResponseCodes.JWT_INVALID.value, jwtResponseCodes.JWT_INVALID.value, httpStatus.UNAUTHORIZED);
//   }
// };

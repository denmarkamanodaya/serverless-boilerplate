// module.exports.jwtLoginMapper = (data) => {
//   const { authUser, customerData, body, headers } = data;
//   return {
//     mobileNumber: body.username,
//     cid: customerData.cid,
//     email: customerData.customerDetails.emailAddress,
//     consumerId: customerData.id,
//     deviceId: headers['x-ud-device-id'],
//     authServiceId: authUser.id,
//   };
// };

// module.exports.jwtLoginNewlyOnboardedMapper = (data) => {
//   const { authUser, body, headers } = data;
//   return {
//     mobileNumber: body.username,
//     deviceId: headers['x-ud-device-id'],
//     authServiceId: authUser.id,
//   };
// };

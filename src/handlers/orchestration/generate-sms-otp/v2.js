const { authVerifyMiddleware: middleware } = require('../../../middlewares/middy');
const { generateOTP } = require('../../../utils/helpers/mfa');
const { httpResponseCodes } = require('../../../common/response-codes');

module.exports.handler = middleware(
  async ({ decodedToken }) => {
    const { mobileNumber } = decodedToken;

    const template = process.env.NOTIFICATION_SERVICE_TOGGLE_ON_OTP_TEMPLATE_NAME;
    const purpose = 'DEVICE_ENROLLMENT';

    const otpId = await generateOTP(mobileNumber, template, purpose);
    return { data: otpId, code: httpResponseCodes.VALID };
  },
  null,
  'authorization'
);

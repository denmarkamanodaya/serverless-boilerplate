const { authVerifyMiddleware: middleware } = require('../../../middlewares/middy');
const { sendOTPSchema } = require('../../../utils/validators/mfa');
const { httpResponseCodes } = require('../../../common/response-codes');
const { generateOTP } = require('../../../utils/helpers/mfa');

module.exports.handler = middleware(
  async ({ body }) => {
    const { username, template, purpose } = body;

    const otpId = await generateOTP(username, template, purpose);

    return { data: otpId, code: httpResponseCodes.VALID };
  },
  sendOTPSchema,
  'authorization'
);

const { authVerifyMiddleware: middleware } = require('../../../middlewares/middy');
const { getAccessCode, getOneKosmosUser } = require('../../../utils/helpers/onekosmos-helper');
const { generateAccessCode } = require('../../../utils/validators/orchestration-v2');
const { accessCodeMapper } = require('../../../utils/mappers/onekosmos-mapper');
const { Users } = require('../../../models/index');
const logger = require('../../../common/logger');
const { httpResponseCodes } = require('../../../common/response-codes');

module.exports.handler = middleware(
  async ({ decodedToken, body }) => {
    const { mobileNumber: username } = decodedToken;
    const { version, kosmosDid: userDid } = body;
    const { data } = await getOneKosmosUser({ username });

    const { username: oneKosmosUsername, email, firstname, lastname, uid } = data[0];
    const map = {
      username: oneKosmosUsername,
      email,
      firstname,
      lastname,
      uid,
      version,
    };

    const [accessLink, userUpdateResult] = await Promise.all([
      getAccessCode(accessCodeMapper(map)),
      Users.update({ userDid }, { where: { username } }),
    ]);

    logger.info(`[kosmos-access-link] | ${username} | ${JSON.stringify(accessLink)} | ${userUpdateResult}`);

    return { code: httpResponseCodes.VALID.value, data: accessLink };
  },
  generateAccessCode,
  'authorization'
);

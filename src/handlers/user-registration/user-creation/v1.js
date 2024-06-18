const httpStatus = require('http-status');
const moment = require('moment');
const { httpResponseCodes, jwtResponseCodes } = require('../../../common/response-codes');
const { defaultMiddleware: middleware } = require('../../../middlewares/middy');
const { validateUserRegUserCreation } = require('../../../utils/validators/user-registration');
const { USER_REGISTRATION_CONFIG } = require('../../../common/constants');
const { getUser, migrateUser } = require('../../../utils/helpers/user-helper');
const { ddbUserRegEntityv2 } = require('../../../utils/aws/dynamo-db');
const { UserRegError } = require('../../../utils/custom-errors/class-errors');

module.exports.handler = middleware(async ({ body }) => {
  const { oneTimeToken, username, password } = body;
  const { Item } = await ddbUserRegEntityv2.get({
    dataset: USER_REGISTRATION_CONFIG.DDB_DATASET_NAME,
    sort_key: oneTimeToken,
  });

  if (!Item || Item.is_valid !== 'true') {
    throw new UserRegError(jwtResponseCodes.JWT_INVALID.value, jwtResponseCodes.JWT_INVALID.value, httpStatus.UNAUTHORIZED);
  }

  const user = await getUser({ username });
  if (user) {
    throw new UserRegError(httpResponseCodes.USER_EXIST.value, httpResponseCodes.USER_EXIST.value, httpStatus.CONFLICT);
  }

  await Promise.all([
    ddbUserRegEntityv2.update({
      dataset: USER_REGISTRATION_CONFIG.DDB_DATASET_NAME,
      sort_key: oneTimeToken,
      is_valid: false,
      updated_at: moment().format(),
    }),
    migrateUser({ username, password }),
  ]);

  return {
    code: httpResponseCodes.USER_SUCCESSFULLY_REGISTERED.value,
    data: {
      message: httpResponseCodes.USER_SUCCESSFULLY_REGISTERED.value,
    },
  };
}, validateUserRegUserCreation);

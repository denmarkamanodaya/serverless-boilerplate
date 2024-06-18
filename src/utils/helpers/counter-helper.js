const { FAILED_LOGIN_CONFIG, MFA_OTP_CONFIG } = require('../../common/constants');
const { ddbFailedLoginCounterEntityv2, ddbOtpCounterEntityv2 } = require('../aws/dynamo-db');
const { authServiceResponseCodes } = require('../../common/response-codes');
const { IamError, MFAError } = require('../custom-errors/class-errors');
const { mfaErrorCodes } = require('../../common/mfa-codes');

const moment = require('moment');
const httpStatus = require('http-status');

module.exports.increaseOTPCounter = async (otpCounterPK, invalid_otp_count) => {
  const counter = (invalid_otp_count || 0) + 1;

  if (counter >= MFA_OTP_CONFIG.OTP_MAX_ATTEMPTS) {
    await ddbOtpCounterEntityv2.update({
      ...otpCounterPK,
      invalid_otp_count: counter,
      is_locked: true,
      locked_until: moment().add(MFA_OTP_CONFIG.OTP_USER_COOLDOWN, MFA_OTP_CONFIG.OTP_TIME_FORMAT).format(),
    });

    throw new MFAError(mfaErrorCodes.SOFT_LOCK, mfaErrorCodes.SOFT_LOCK, httpStatus.UNAUTHORIZED);
  }

  await ddbOtpCounterEntityv2.update({ ...otpCounterPK, invalid_otp_count: counter });
};

module.exports.incrementFailedLoginCounter = async ({ username }) => {
  const counterAttribute = {
    dataset: FAILED_LOGIN_CONFIG.DDB_DATASET_NAME,
    sort_key: username,
  };

  const { Item } = await ddbFailedLoginCounterEntityv2.get(counterAttribute);

  if (typeof Item === 'undefined') {
    await ddbFailedLoginCounterEntityv2.put({
      ...counterAttribute,
      ...{
        counter: 1,
        created_at: moment().format(),
      },
    });
  } else {
    await ddbFailedLoginCounterEntityv2.update(
      counterAttribute,
      {},
      {
        SET: ['#counter = #counter + :increment, #updated_at = :updated_at_value'],
        ExpressionAttributeNames: {
          '#counter': 'counter',
          '#updated_at': 'updated_at',
        },
        ExpressionAttributeValues: {
          ':increment': 1,
          ':updated_at_value': moment().format(),
        },
      }
    );

    if (Item.counter >= FAILED_LOGIN_CONFIG.MAX_ATTEMPTS - 1 && typeof Item.lock_duration_datetime === 'undefined') {
      const durationDateTime = moment(moment().format()).add(FAILED_LOGIN_CONFIG.LOCKOUT_DURATION, 'seconds').format();
      await ddbFailedLoginCounterEntityv2.update({
        ...counterAttribute,
        lock_duration_datetime: durationDateTime,
        lock_duration_seconds: FAILED_LOGIN_CONFIG.LOCKOUT_DURATION,
      });

      throw new IamError(
        `${authServiceResponseCodes.LOGIN_MAX_ATTEMPTS.value}. Until ${FAILED_LOGIN_CONFIG.LOCKOUT_DURATION}`,
        authServiceResponseCodes.LOGIN_MAX_ATTEMPTS.value,
        httpStatus.FORBIDDEN
      );
    } else {
      const current = moment().format();
      const event = Item.lock_duration_datetime;

      if (Item.counter >= FAILED_LOGIN_CONFIG.MAX_ATTEMPTS && current < event) {
        throw new IamError(
          `${authServiceResponseCodes.LOGIN_MAX_ATTEMPTS.value}. Until ${FAILED_LOGIN_CONFIG.LOCKOUT_DURATION}`,
          authServiceResponseCodes.LOGIN_MAX_ATTEMPTS.value,
          httpStatus.FORBIDDEN
        );
      }

      if (Item.counter >= FAILED_LOGIN_CONFIG.MAX_ATTEMPTS && current > event) {
        await this.resetFailedLoginCounter({ username });
      }
    }
  }
};

module.exports.resetFailedLoginCounter = async ({ username }) => {
  const counterAttribute = {
    dataset: FAILED_LOGIN_CONFIG.DDB_DATASET_NAME,
    sort_key: username,
  };

  const { Item } = await ddbFailedLoginCounterEntityv2.get(counterAttribute);

  if (typeof Item !== 'undefined') {
    const current = moment().format();
    const event = Item.lock_duration_datetime;

    if (current < event) {
      throw new IamError(
        `${authServiceResponseCodes.LOGIN_MAX_ATTEMPTS.value}. Until ${moment
          .duration(moment(event).diff(current))
          .asSeconds()}`,
        authServiceResponseCodes.LOGIN_MAX_ATTEMPTS.value,
        httpStatus.FORBIDDEN
      );
    }

    await ddbFailedLoginCounterEntityv2.update({
      ...counterAttribute,
      ...{
        counter: 0,
        $remove: ['lock_duration_seconds', 'lock_duration_datetime'],
      },
    });
  }
};

const { ddbOtpEntityv2 } = require('../../utils/aws/dynamo-db');
const { MFA_OTP_CONFIG } = require('../../common/constants');
const moment = require('moment');

module.exports.markAsUsed = async ({ sort_key }) => {
  const params = {
    dataset: MFA_OTP_CONFIG.DDB_DATASET_NAME,
    sort_key,
    is_used: true,
    updated_at: moment().format(),
  };
  ddbOtpEntityv2.update(params);
};

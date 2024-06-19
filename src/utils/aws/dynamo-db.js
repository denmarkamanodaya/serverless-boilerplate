// const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
// const { Table, Entity } = require('dynamodb-toolbox');

// const {
//   DYNAMO_CONFIG,
//   USER_MIGRATION_CONFIG,
//   USER_REGISTRATION_CONFIG,
//   WSO2_COUNTER_CONFIG,
//   FAILED_LOGIN_CONFIG,
//   MFA_OTP_CONFIG,
// } = require('../../common/constants');

// const awsConfig = {
//   // region: process.env.AWS_SECRETS_MANAGER_REGION,
//   endpoint: 'http://localhost:8000',
// };

// const DocumentClient = new DynamoDBClient(awsConfig);

// const table = new Table({
//   name: DYNAMO_CONFIG.DB_NAME,
//   partitionKey: 'dataset',
//   sortKey: 'sort_key',
//   DocumentClient,
// });

// module.exports.ddbJwtEntityv2 = new Entity({
//   name: USER_MIGRATION_CONFIG.DDB_DATASET_NAME,
//   attributes: {
//     dataset: { partitionKey: true },
//     sort_key: { sortKey: true },
//     access_token: { type: 'string', required: true },
//     kms_key_arn: { type: 'string', required: true },

//     consumer_id: { type: 'string', required: false },
//     mobile_number: { type: 'string', required: true },
//     email: { type: 'string', required: false },
//     device_id: { type: 'string', required: false },
//     cid: { type: 'string', required: false },
//     auth_service_id: { type: 'string', required: false },
//     exp: { type: 'string', required: true },
//     iat: { type: 'string', required: true },

//     is_valid: { type: 'boolean', required: true },
//     created_at: { type: 'string' },
//     updated_at: { type: 'string' },
//   },
//   table: table,
// });

// module.exports.ddbUserRegEntityv2 = new Entity({
//   name: USER_REGISTRATION_CONFIG.DDB_DATASET_NAME,
//   attributes: {
//     dataset: { partitionKey: true },
//     sort_key: { sortKey: true },

//     is_valid: { type: 'string', required: true },
//     otp: { type: 'string', required: true },
//     country_code: { type: 'string', required: true },
//     mobile_number: { type: 'string', required: true },

//     created_at: { type: 'string' },
//     updated_at: { type: 'string' },
//   },
//   table: table,
// });

// module.exports.ddbWso2CounterEntityv2 = new Entity({
//   name: WSO2_COUNTER_CONFIG.DDB_DATASET_NAME,
//   attributes: {
//     dataset: { partitionKey: true },
//     sort_key: { sortKey: true },

//     counter: { type: 'number', required: true },

//     created_at: { type: 'string' },
//     updated_at: { type: 'string' },
//   },
//   table: table,
// });

// module.exports.ddbFailedLoginCounterEntityv2 = new Entity({
//   name: FAILED_LOGIN_CONFIG.DDB_DATASET_NAME,
//   attributes: {
//     dataset: { partitionKey: true },
//     sort_key: { sortKey: true },

//     counter: { type: 'number', required: true },
//     lock_duration_seconds: { type: 'number', required: false },
//     lock_duration_datetime: { type: 'string', required: false },

//     created_at: { type: 'string' },
//     updated_at: { type: 'string' },
//   },
//   table,
// });

// module.exports.ddbOtpEntityv2 = new Entity({
//   name: MFA_OTP_CONFIG.DDB_DATASET_NAME,
//   attributes: {
//     dataset: { partitionKey: true },
//     sort_key: { sortKey: true },
//     purpose: { type: 'string', required: true },
//     otp: { type: 'string', required: true },
//     is_used: { type: 'boolean' },
//     duration: { type: 'string' },
//     country_code: { type: 'string' },
//     transaction_id: { type: 'string' },
//     mfa_token: { type: 'string' },
//     validity_until: { type: 'string' },
//     created_at: { type: 'string' },
//     updated_at: { type: 'string' },
//   },
//   table,
// });

// module.exports.ddbOtpCounterEntityv2 = new Entity({
//   name: MFA_OTP_CONFIG.OTP_COUNTER_DATASET_NAME,
//   attributes: {
//     dataset: { partitionKey: true },
//     sort_key: { sortKey: true },
//     invalid_otp_count: { type: 'number' },
//     is_locked: { type: 'string' },
//     locked_until: { type: 'string' },
//     created_at: { type: 'string' },
//     updated_at: { type: 'string' },
//   },
//   table,
// });

// module.exports.ddbOtpCooldownEntityv2 = new Entity({
//   name: MFA_OTP_CONFIG.OTP_COOLDOWN_DATASET_NAME,
//   attributes: {
//     dataset: { partitionKey: true },
//     sort_key: { sortKey: true },
//     invalid_otp_count: { type: 'number' },
//     is_locked: { type: 'string' },
//     locked_until: { type: 'string' },
//     created_at: { type: 'string' },
//     updated_at: { type: 'string' },
//   },
//   table,
// });

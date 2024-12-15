const { getOrgByName, createOrg, createRole } = require('../../../utils/helpers/auth0');
const { defaultMiddleware: middleware } = require('../../../middlewares/middy');
const { httpResponseCodes } = require('../../../common/response-codes');
const { validateOrgsSchema } = require('../../../utils/validators/org');
const logger = require('../../../common/logger');
const httpStatus = require('http-status');

module.exports.handler = middleware(async ({ headers, body }) => {
  logger.debug(JSON.stringify({ headers, body }));
  const organizations = body.organizations;

  organizations.forEach(async function(organization) {
    // Create organization
    try { 
        await getOrgByName(organization.name); 
    } catch (err) { 
        if(err.statusCode == httpStatus.NOT_FOUND) {
            createOrg(organization.name); 
        }
    }

    // Create role - bypass*
    createRole(organization.role);
  });

  return {
    status: httpStatus.ACCEPTED,
    code: httpResponseCodes.ACCEPTED.value,
    data: httpResponseCodes.ACCEPTED.value,
  }
}, validateOrgsSchema);
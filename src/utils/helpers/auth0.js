const { AUTH0_TENANT, REGULAR_EXPRESSION } = require('../../common/constants');
const { ManagementClient } = require('auth0');

const management = new ManagementClient({
    domain: AUTH0_TENANT.DOMAIN, 
    clientId: AUTH0_TENANT.CLIENT_ID,
    clientSecret: AUTH0_TENANT.CLIENT_SECRET,
});

module.exports.createRole = async (roleName ) => {
    return management.roles.create({
        "name": roleName,
        "description": roleName.replace(REGULAR_EXPRESSION.REPLACE_HYPEN, ' '),
    });
}

module.exports.createOrg = async (orgName) => {
    return management.organizations.create({
        "name": orgName,
        "display_name": orgName.replace(REGULAR_EXPRESSION.REPLACE_HYPEN, ' '),
    });
}

module.exports.getOrgByName = async (orgName) => {
    return management.organizations.getByName({
        "name": orgName,
    });
}

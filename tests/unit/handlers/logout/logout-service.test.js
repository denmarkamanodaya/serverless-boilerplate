const { logout } = require('../../../../src/services/logout/logout-service');
const { logoutFixture } = require('../../../fixtures/logout.fixtures');
const { UserSessions } = require('../../../../src/models/index');
const { sessionA } = require('../../../fixtures/auth-service-db');
const { drop, seed, sync } = require('../../../utils/base-sync');
describe('Logout Service', () => {
  beforeAll(async()=> {
    await sync();
    sessionA.accessToken = 'thisIsToken';
    sessionA.isValid = true;
    await seed('UserSessions', sessionA);

  });
  afterAll(async () => {
    await drop();
  });

  const data = {
    body: {
      token: 'thisIsToken',
    },
  };

  test('should revoke the token', async () => {
    const response = await logout(data);
    const getUserSessionsData = await UserSessions.findOne({accessToken: data.body.token});
    expect(getUserSessionsData.isValid).toBe(false);
    expect(JSON.stringify(response)).toBe(logoutFixture.sessionRevoked);
  });
});

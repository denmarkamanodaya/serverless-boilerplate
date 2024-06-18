describe('model-sequelize', () => {
  test('Mock actual db connection', async () => {
    process.env.NODE_ENV = 'dev';
    process.env.DB_HOST_READER = 'reader';
    process.env.DB_HOST_WRITER = 'writer';
    process.env.user = 'username';
    process.env.password = 'password';

    // eslint-disable-next-line global-require
    const { sequelize } = require('../../../src/models/index');

    jest.spyOn(sequelize, 'authenticate').mockResolvedValue();

    await expect(sequelize.authenticate()).resolves.not.toThrow();

    process.env.NODE_ENV = 'test';
  });
});

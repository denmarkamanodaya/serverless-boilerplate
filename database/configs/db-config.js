const secrets = require('config-dug').default;

module.exports = {
  development: {
    username: secrets.user,
    password: secrets.password,
    database: secrets.DB,
    host: secrets.DB_HOST_WRITE,
    read: secrets.DB_HOST_READ,
    write: secrets.DB_HOST_WRITE,
    dialect: 'mysql',
    port: 3306,
    pool: 50,
  },
  test: {
    dialect: 'sqlite',
    host: ':memory:',
  },
  staging: {
    username: secrets.user,
    password: secrets.password,
    database: secrets.DB,
    host: secrets.DB_HOST_WRITE,
    read: secrets.DB_HOST_READ,
    write: secrets.DB_HOST_WRITE,
    dialect: 'mysql',
    port: 3306,
    pool: 50,
  },
  production: {
    username: secrets.user,
    password: secrets.password,
    database: secrets.DB,
    host: secrets.DB_HOST_WRITE,
    read: secrets.DB_HOST_READ,
    write: secrets.DB_HOST_WRITE,
    dialect: 'mysql',
    port: 3306,
    pool: 50,
  },
};

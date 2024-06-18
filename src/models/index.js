/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV;

const secrets = require('config-dug').default;

const db = {};

let sequelize;

sequelize =
  env === 'test'
    ? new Sequelize({
        dialect: 'sqlite',
        storage: 'tests/test.sqlite',
      })
    : new Sequelize(secrets.DB, null, null, {
        logging: false,
        dialect: 'mysql',
        port: 3306,
        replication: {
          read: [
            {
              host: secrets.DB_HOST_READER,
              username: secrets.user,
              password: secrets.password,
            },
          ],
          write: {
            host: secrets.DB_HOST_WRITER,
            username: secrets.user,
            password: secrets.password,
          },
        },
        pool: {
          max: 2,
          min: 0,
          idle: 0,
          acquire: 3000,
          evict: 6000,
        },
      });

fs.readdirSync(__dirname)
  .filter((file) => {
    return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js';
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  /* istanbul ignore else */
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

const { format, createLogger, transports } = require('winston');
const { timestamp, combine, errors, json, printf } = format;

const logFormat = printf((info) => `${info.timestamp} ${info.level}: ${info.message}`);
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), json()),
  transports: [
    new transports.Console({
      format: combine(logFormat),
    }),
  ],
});

module.exports = logger;

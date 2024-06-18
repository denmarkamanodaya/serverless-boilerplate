const { authenticator } = require('otplib');
const base32 = require('thirty-two');
const crypto = require('crypto');

module.exports.verify = (totp, secret) => authenticator.check(totp, secret, { window: 0, step: 30 });

module.exports.createSecret = () => base32.encode(crypto.randomBytes(20)).toString().replace(/=/g, '');

/* eslint-disable no-param-reassign */
module.exports.pick = (object, keys) => keys.reduce((obj, key) => {
  if (object && Object.prototype.hasOwnProperty.call(object, key)) {
    obj[key] = object[key];
  }
  return obj;
}, {});

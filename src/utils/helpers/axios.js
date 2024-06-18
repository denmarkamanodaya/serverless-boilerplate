const axios = require('axios').default;

module.exports = (config) => axios.create(config);

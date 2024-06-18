/*
 * This is a boiler plate for
 * generic axios interceptor
 */
// const logger = require('./logger');
const axios = require('axios').default;

class AxiosInterceptor {
  constructor(config) {
    this.config = config;
    this.axios = axios.create(config);
  }

  // this is redundant, just pass the config during the creation of the axios instance, it does the same thing
  // #getConfig(config) {
  //   config.baseURL = this.config.baseURL;
  //   if (this.config?.headers) {
  //     Object.keys(this.config?.headers).forEach((header) => {
  //       config.headers[header] = this.config.headers[header];
  //     });
  //   }
  //   if (this.config?.httpsAgent) {
  //     config.httpsAgent = this.config.httpsAgent;
  //   }
  //   return config;
  // }

  get axiosInstance() {
    // not valid anymore since we are directly passing the config to the instance
    // error won't run here as well since this is just the setup part
    // even though you pass wrong params nothing will happen
    // this.axios.interceptors.request.use(
    //   (config) => this.#getConfig(config),
    //   (error) => this.#getError(error)
    // );
    // you might want to re-enable this for custom error handling
    // this.axios.interceptors.response.use(
    //   (response) => response,
    //   (error) => this.#getError(error)
    // );
    return this.axios;
  }

  // #getError(error) {
  //   logger.error(error);
  //   return error;
  // }
}

module.exports = {
  AxiosInterceptor,
};

// see more options here: https://axios-http.com/docs/req_config

// todo: get from env vars
const defaultHttpConfig = Object.freeze({
    timeout: 5000,
    withCredentials: false,
    validateStatus: () => true, // think, if we need to remove throwOrJson function
    // validateStatus: status => (status >= 200 && status < 300), // default
});

module.exports = defaultHttpConfig;

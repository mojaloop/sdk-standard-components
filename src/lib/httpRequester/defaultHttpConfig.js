// see more options here: https://axios-http.com/docs/req_config

// think, which else default options we need to have (maybe, use env vars)
const defaultHttpConfig = Object.freeze({
    timeout: 65_000, // there's lots of callback/request timeouts in TTK with 60_000 ms
    withCredentials: false,
    validateStatus: () => true, // think, if we need to remove throwOrJson function
    // validateStatus: status => (status >= 200 && status < 300), // default
});

module.exports = defaultHttpConfig;

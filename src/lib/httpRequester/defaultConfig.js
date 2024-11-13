const axiosRetry = require('axios-retry');
const { DEFAULT_TIMEOUT, DEFAULT_RETRIES } = require('./constants');

const retryableStatusCodes = [
    408,
    429,
    500,
    502,
    503,
    504,
];

const retryableHttpErrorCodes = [
    'ETIMEDOUT'
];

// think, which else default options we need to have (maybe, use env vars)
// See more options here: https://axios-http.com/docs/req_config
const createDefaultHttpConfig = () => Object.freeze({
    timeout: DEFAULT_TIMEOUT,
    withCredentials: false,
    // validateStatus: status => (status >= 200 && status < 300), // default
    transitional: {
        clarifyTimeoutError: true, // to set ETIMEDOUT error code on timeout instead of ECONNABORTED
    }
});

const createDefaultRetryConfig = (logger) => Object.freeze({
    retries: DEFAULT_RETRIES,
    retryCondition: (err) => {
        const needRetry = axiosRetry.isNetworkOrIdempotentRequestError(err)
            || axiosRetry.isRetryableError(err)
            || retryableStatusCodes.includes(err.status)
            || retryableHttpErrorCodes.includes(err.code);
        logger.isDebugEnabled && logger.push({ needRetry, err }).debug('retryCondition is evaluated');
        return needRetry;
    },
    onRetry: (retryCount, err) => {
        logger.isVerboseEnabled && logger.push({ retryCount, err }).verbose(`retrying HTTP request due to ${err?.message}...`);
    },
    onMaxRetryTimesExceeded: (err, retryCount) => {
        logger.isInfoEnabled && logger.push({ retryCount, err }).info('max retries exceeded on HTTP request!');
    },
});

module.exports = {
    createDefaultHttpConfig,
    createDefaultRetryConfig,
};

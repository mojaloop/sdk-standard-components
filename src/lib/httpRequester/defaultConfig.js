const axiosRetry = require('axios-retry');
const {
    DEFAULT_TIMEOUT,
    DEFAULT_RETRIES,
    DEFAULT_RETRY_DELAY,
} = require('./constants');

const retryableStatusCodes = [
    408,
    429,
    502,
    503,
];

const retryableHttpErrorCodes = [
    'ETIMEDOUT',
    'EAI_AGAIN'
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

// See all retry options here: https://github.com/softonic/axios-retry?tab=readme-ov-file#options
const createDefaultRetryConfig = (logger) => Object.freeze({
    retries: DEFAULT_RETRIES,
    retryCondition: (err) => {
        const needRetry = axiosRetry.isNetworkOrIdempotentRequestError(err)
            || axiosRetry.isRetryableError(err)
            || retryableStatusCodes.includes(err.status)
            || retryableHttpErrorCodes.includes(err.code);
        logger.isDebugEnabled && logger.push(formatAxiosError(err)).debug(`retryCondition is evaluated to ${needRetry}`);
        return needRetry;
    },
    retryDelay: (retryCount) => {
        const delay = DEFAULT_RETRY_DELAY;
        logger.isDebugEnabled && logger.push({ delay, retryCount }).debug(`http retryDelay is ${delay}ms`);
        return delay;
    },
    onRetry: (retryCount, err) => {
        logger.isVerboseEnabled && logger.push(formatAxiosError(err, retryCount)).verbose(`retrying HTTP request...  [reason: ${err?.message}]`);
    },
    onMaxRetryTimesExceeded: (err, retryCount) => {
        logger.isInfoEnabled && logger.push(formatAxiosError(err, retryCount)).info('max retries exceeded for HTTP request!');
    },
});

const formatAxiosError = (error, retryCount) =>  {
    const { message, code, status, response } = error;

    return {
        message, code, status,
        ...(response?.data && { errorResponseData: response.data }),
        ...(retryCount && { retryCount }),
    };
};

module.exports = {
    createDefaultHttpConfig,
    createDefaultRetryConfig,
};

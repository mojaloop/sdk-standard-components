/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 * Eugen Klymniuk <eugen.klymniuk@infitx.com>

 --------------
 ******/

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

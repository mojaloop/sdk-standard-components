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
 * Kevin Leyow <kevin.leyow@infitx.com>

 --------------
 ******/

/**
 * Sanitizes a request object for safe logging by redacting sensitive fields.
 * Fields such as Authorization, httpAgent, and httpsAgent are replaced with '[REDACTED]'.
 * Note: This function mutates the original request object.
 * @param {Object} request - The request object to sanitize.
 * @returns {Object} The sanitized request object.
 */
function sanitizeRequest(request) {
    if (!request || typeof request !== 'object') return request;

    if (request.headers && request.headers.Authorization) {
        request.headers.Authorization = '[REDACTED]';
    }
    if (request.httpAgent) request.httpAgent = '[REDACTED]';
    if (request.httpsAgent) request.httpsAgent = '[REDACTED]';
    return request;
}

/**
 * Mutates and sanitizes an error object for safe logging.
 * Sensitive fields like Authorization, httpAgent, httpsAgent are redacted.
 * @param {Object} err
 * @returns {Object} The mutated error object
 */
function sanitizeError(err) {
    if (!err || typeof err !== 'object') return err;

    // config
    if (err.config && err.config.headers && err.config.headers.Authorization) {
        err.config.headers.Authorization = '[REDACTED]';
    }
    if (err.config && err.config.httpAgent) {
        err.config.httpAgent = '[REDACTED]';
    }
    if (err.config && err.config.httpsAgent) {
        err.config.httpsAgent = '[REDACTED]';
    }

    // originalRequest
    if (err.originalRequest) {
        if (err.originalRequest.headers && err.originalRequest.headers.Authorization) {
            err.originalRequest.headers.Authorization = '[REDACTED]';
        }
        if (err.originalRequest.httpAgent) {
            err.originalRequest.httpAgent = '[REDACTED]';
        }
        if (err.originalRequest.httpsAgent) {
            err.originalRequest.httpsAgent = '[REDACTED]';
        }
    }

    // request
    if (err.request) {
        err.request = '[REDACTED]';
    }

    // response.config
    if (err.response && err.response.config && err.response.config.headers) {
        if (err.response.config.headers.Authorization) {
            err.response.config.headers.Authorization = '[REDACTED]';
        }
        if (err.response.config.httpAgent) {
            err.response.config.httpAgent = '[REDACTED]';
        }
        if (err.response.config.httpsAgent) {
            err.response.config.httpsAgent = '[REDACTED]';
        }
    }

    return err;
}

module.exports = {
    sanitizeRequest,
    sanitizeError
};

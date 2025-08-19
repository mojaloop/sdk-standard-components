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

const { URL } = require('node:url');
const https = require('node:https');
const querystring = require('node:querystring');
const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const safeStringify = require('fast-safe-stringify');
const { ResponseType } = require('./constants');

axios.defaults.headers.common = {}; // do not use default axios headers

/**
 * @typedef {Object} AxiosHttpRequestDeps
 * @prop {Logger} logger - Logger instance.
 * @prop {axios.AxiosRequestConfig} httpConfig - Default configuration for axios instance.
 * @prop {Object} [retryConfig] - Default configuration for axiosRetry. (details: https://github.com/softonic/axios-retry?tab=readme-ov-file#options)
 * @prop {Object} [httpClient] - HTTP client to be used to send requests.
 */

class AxiosHttpRequester {
    #httpClient;

    /**
     * Create a new AxiosHttpRequest instance
     *
     * @param {AxiosHttpRequestDeps} deps
     * @returns {AxiosHttpRequester}
     */
    constructor(deps) {
        this.deps = deps;
        this.logger = deps.logger.child({ component: this.constructor.name });
        this.#httpClient = this.#createAxiosClient(deps);
    }

    /**
     * Sends HTTP requests with provided options
     *
     * @param {HttpOptions} httpOpts - HTTP options
     * @returns {Promise<unknown>} HTTP response
     */
    async sendRequest(httpOpts) {
        let originalRequest = null; // todo: think, if we need
        try {
            const axiosOpts = this.convertToAxiosOptions(httpOpts);
            originalRequest = {
                ...axiosOpts,
                ...(axiosOpts.httpAgent && { httpAgent: '[REDACTED]' }),
                ...(axiosOpts.httpsAgent && { httpsAgent: '[REDACTED]' }),
                body: safeStringify(axiosOpts.data), // todo: think, if we need this (or use data JSON)
            };

            this.logger.push({ originalRequest }).debug('sending HTTP request...');
            const httpResponse = await this.#httpClient.request(axiosOpts);

            const response = this.#makeSuccessResponse(httpResponse, originalRequest);
            this.logger.push({ response }).debug('sending HTTP request is done');
            return response;
        } catch (err) {
            err.originalRequest = originalRequest;
            throw this.#makeErrorResponse(err);
            // think, how to handle errors: rethrow AxiosError ot create our own HttpError?
        }
    }

    get responseType() { return ResponseType; }

    /** @param {HttpOptions} httpOpts */
    convertToAxiosOptions(httpOpts) {
        const {
            uri,
            method,
            headers,
            qs,
            body,
            responseType, // = ResponseType.JSON
            agent,
            timeout,
            httpConfig = {},
        } = httpOpts;

        const completeUrl = new URL(uri.startsWith('http') ? uri : `http://${uri}`);

        return {
            ...this.deps.httpConfig,
            ...httpConfig, // to be able to override default axios options
            method,
            baseURL: completeUrl.origin,
            url: this.constructRoutePart(completeUrl, qs),
            data: body,
            headers,
            responseType,
            timeout,
            ...(!agent ? null : {
                [agent instanceof https.Agent ? 'httpsAgent' : 'httpAgent']: agent
            }),
        };
    }

    constructRoutePart(completeUrl, qs) {
        const qsEnc = querystring.encode(qs);

        let search = completeUrl.search || '';
        if (qsEnc.length) {
            search += search.length ? '&' : '?';
            search += qsEnc;
        }

        return completeUrl.pathname + search + completeUrl.hash;
    }


    #makeSuccessResponse(axiosResponse, originalRequest) {
        const { data, status, headers } = axiosResponse;

        // todo: think, if we need to preserve this validation - it does not work with FSPIOP interoperability headers
        if (originalRequest.responseType === ResponseType.JSON) {
            const contentType = headers['content-type'];
            if (!/^application\/json/.test(contentType)) {
                const err = new Error('Invalid content-type. ' +
                `Expected application/json but received ${contentType}: ${data?.toString()}`);
                err.originalRequest = {
                    ...originalRequest,
                    headers: {
                        ...originalRequest.headers,
                        Authorization: originalRequest.headers?.Authorization ? '[REDACTED]' : undefined
                    },
                    body: originalRequest.body ? '[REDACTED]' : undefined,
                    httpAgent: originalRequest.httpAgent ? '[REDACTED]' : undefined,
                    httpsAgent: originalRequest.httpsAgent ? '[REDACTED]' : undefined
                };
                err.status = status;
                err.contentType = contentType;
                throw err;
            }
        }

        return {
            data,
            headers: headers?.toJSON(),
            statusCode: status,
            originalRequest
        };
    }

    #makeErrorResponse(err) {
        err.statusCode = err.status || err.response?.status; // for backward compatibility

        let config;
        if (err.config) {
            const { method, baseURL, url, params } = err.config;
            config = { method, baseURL, url, params, restData: '[REDACTED]' };
        }

        // Remove sensitive information before logging
        const sanitizedError = new Error(err.message || 'HTTP request error');
        sanitizedError.name = err.name || 'AxiosHttpRequesterError';
        sanitizedError.statusCode = err.statusCode;
        sanitizedError.code = err.code; // maintain err.code
        sanitizedError.status = err.status;
        sanitizedError.contentType = err.contentType;
        sanitizedError.stack = err.stack;
        sanitizedError.config = config;
        sanitizedError.originalRequest = err.originalRequest ? { ...err.originalRequest } : undefined;
        sanitizedError.response = err.response ? { ...err.response } : undefined;

        // Redact sensitive fields
        if (sanitizedError.config && sanitizedError.config.headers) {
            sanitizedError.config.headers = { ...sanitizedError.config.headers };
            if (sanitizedError.config.headers.Authorization) {
                sanitizedError.config.headers.Authorization = '[REDACTED]';
            }
        }
        if (sanitizedError.config && sanitizedError.config.httpAgent) {
            sanitizedError.config.httpAgent = '[REDACTED]';
        }
        if (sanitizedError.config && sanitizedError.config.httpsAgent) {
            sanitizedError.config.httpsAgent = '[REDACTED]';
        }
        if (sanitizedError.originalRequest) {
            if (sanitizedError.originalRequest.headers && sanitizedError.originalRequest.headers.Authorization) {
                sanitizedError.originalRequest.headers.Authorization = '[REDACTED]';
            }
            if (sanitizedError.originalRequest.body) {
                sanitizedError.originalRequest.body = '[REDACTED]';
            }
            if (sanitizedError.originalRequest.httpAgent) {
                sanitizedError.originalRequest.httpAgent = '[REDACTED]';
            }
            if (sanitizedError.originalRequest.httpsAgent) {
                sanitizedError.originalRequest.httpsAgent = '[REDACTED]';
            }
        }
        if (sanitizedError.request) {
            sanitizedError.request = '[REDACTED]';
        }
        if (sanitizedError.response && sanitizedError.response.config && sanitizedError.response.config.headers) {
            sanitizedError.response.config.headers = { ...sanitizedError.response.config.headers };
            if (sanitizedError.response.config.headers.Authorization) {
                sanitizedError.response.config.headers.Authorization = '[REDACTED]';
            }
            if (sanitizedError.response.config.httpAgent) {
                sanitizedError.response.config.httpAgent = '[REDACTED]';
            }
            if (sanitizedError.response.config.httpsAgent) {
                sanitizedError.response.config.httpsAgent = '[REDACTED]';
            }
        }
        this.logger.warn('error in sending HTTP request', { error: sanitizedError });
        throw sanitizedError;
    }

    /** @param {AxiosHttpRequestDeps} deps */
    #createAxiosClient(deps) {
        if (deps.httpClient) return deps.httpClient;

        this.logger.push(deps.httpConfig).debug('createAxiosClient...');
        const client = deps.httpConfig
            ? axios.create(deps.httpConfig)
            : axios.default;
        // IMPORTANT! using axios.create() might break some existing functionalities

        if (deps.retryConfig) {
            axiosRetry(client, deps.retryConfig);
            this.logger.push(deps.retryConfig).debug('added retryConfig to http client');
        }
        // think, if we need request-specific retry configuration

        return client;
    }
}

module.exports = AxiosHttpRequester;

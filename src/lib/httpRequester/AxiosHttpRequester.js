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
 * @prop {Object} [httpClient] - HTTP client to be used to send requests.
 * @prop {Object} httpConfig - Default configuration for axios instance.
 * @prop {Object} retryConfig - Default configuration for axiosRetry. (details: https://github.com/softonic/axios-retry?tab=readme-ov-file#options)
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
        this.logger = deps.logger;
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
            // todo: think, how to handle errors: rethrow AxiosError ot create our own HttpError?
        }
    }

    get responseType() { return ResponseType; }

    convertToAxiosOptions(httpOpts) {
        const {
            uri,
            method,
            headers,
            qs,
            body,
            responseType, // = ResponseType.JSON
            agent,
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
                err.originalRequest = originalRequest;
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
        if (err.config) {
            err.config = {
                ...err.config,
                ...(err.config.httpAgent && { httpAgent: '[REDACTED]' }),
                ...(err.config.httpsAgent && { httpsAgent: '[REDACTED]' }),
            };
        }
        this.logger.push({ err }).warn('error in sending HTTP request');
        return err;
    }

    #createAxiosClient(deps) {
        if (deps.httpClient) return deps.httpClient;

        this.logger.push(deps.httpConfig).debug('createAxiosClient...');
        const client = axios.default; // todo: think, if we need to use axios.create
        // const client = axios.create(deps.config);

        if (deps.retryConfig) {
            axiosRetry(client, deps.retryConfig);
            this.logger.push(deps.retryConfig).debug('added retryConfig to http client');
        }
        // think, if we need request-specific retry configuration

        return client;
    }
}

module.exports = AxiosHttpRequester;

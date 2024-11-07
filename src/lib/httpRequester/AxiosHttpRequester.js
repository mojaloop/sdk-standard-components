const { URL } = require('node:url');
const querystring = require('node:querystring');
const safeStringify = require('fast-safe-stringify');
const axios = require('axios');
const { ResponseType } = require('./constants');

/**
 * @typedef {Object} AxiosHttpRequestDeps
 * @prop {Logger} logger - Logger instance.
 * @prop {Object} httpClient - HTTP client to be used to send requests.
 * @prop {Object} config - Configuration new axios instance.
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
        this.logger = deps.logger.push({ component: AxiosHttpRequester.name });
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
            const axiosOpts = this.#convertToAxiosOptions(httpOpts);
            originalRequest = {
                ...axiosOpts,
                body: safeStringify(axiosOpts.data), // todo: think, if we need this (or use data JSON)
                agent: '[REDACTED]',
            };

            this.logger.push({ originalRequest }).debug('sending HTTP request...');
            const httpResponse = await this.#httpClient.request(axiosOpts);

            const response = this.#makeResponse(httpResponse, originalRequest);
            this.logger.push({ response }).debug('sending HTTP request is done');
            return response;
        } catch (err) {
            err.originalRequest = originalRequest;
            this.logger.push({ err }).warn('error in sending HTTP request');
            throw err;
            // todo: think, how to handle errors
        }
    }

    get responseType() { return ResponseType; }

    #convertToAxiosOptions(httpOpts) {
        const {
            uri,
            method,
            headers,
            qs,
            body,
            responseType = ResponseType.JSON,
            agent,
            // config = null,
        } = httpOpts;

        const qsEnc = querystring.encode(qs);
        const completeUrl = new URL(uri + (qsEnc.length ? `?${qsEnc}` : ''));

        return {
            method,
            baseURL: completeUrl.hostname,
            url: completeUrl.pathname + completeUrl.search + completeUrl.hash,
            data: body,
            headers,
            responseType,
            agent,
            // todo: add timeout
        };
    }

    #makeResponse(axiosResponse, originalRequest) {
        const { data, status, headers } = axiosResponse;

        // todo: think, if we need to preserve this validation
        if (originalRequest.responseType === ResponseType.JSON) {
            const contentType = headers['content-type'];
            if (!/^application\/json/.test(contentType)) {
                const err = new Error('Invalid content-type. ' +
                    `Expected application/json but received ${contentType}: ${data?.toString()}`);
                err.originalRequest = originalRequest;
                err.statusCode = status;
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

    #createAxiosClient(deps) {
        if (deps.httpClient) return deps.httpClient;

        this.logger.push(deps.config).debug('createAxiosClient...');
        const client = axios.create(deps.config);
        client.defaults.headers.common = {}; // do not use default axios headers

        return client;
    }
}

module.exports = AxiosHttpRequester;

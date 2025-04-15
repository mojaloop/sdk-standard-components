'use strict';

const http = require('node:http');
const https = require('node:https');

const { createHttpRequester } = require('../httpRequester');
const { RESOURCES, ISO_20022_HEADER_PART } = require('../constants');
const JwsSigner = require('../jws').signer;
const {
    buildUrl,
    defineApiType,
    formatEndpointOrDefault,
    ResponseType,
    throwOrJson,
} = require('./common');

const { ApiType, ApiTransformer } = require('./apiTransformer');


/**
 *
 * @class BaseRequests
 * @description BaseRequests is a 'mojaloop aware' base class for making mojaloop requests
 *   it contains all of the common bits that a Mojaloop client library needs to implement
 *   such as `jws`, `tls`, `mojaloop endpoints`, etc, and exposes functions for `_get()`,
 *   `_post()`, and `_put()` requests
 */
class BaseRequests {

    /**
     * @param {Object} config - The Config Object
     * @param {Object} config.logger - Logging function
     * @param {Object} config.tls - The tls config object
     * @param {string} config.dfspId - The `FSPID` of _this_ DFSP/Participant
     * @param {boolean} config.jwsSign - If `true`, then requests will be JWS signed
     * @param {boolean} [config.jwsSignPutParties] - If not provided, it will default to the value of `config.jwsSign`
     * @param {string} [config.jwsSigningKey] - The jwsSigningKey to use. Required if `jwsSign === true`
     * @param {Object} [config.wso2] The wso2Auth object and
     *   number indicating how many times to retry a request that fails authorization.
     *   Example: { auth, retryWso2AuthFailureTimes: 1 }
     * @param {object} config.httpConfig - Options for httpClient (axios) - see: https://axios-http.com/docs/req_config
     * @param {object} config.retryConfig - Options for axios-retry - see: https://github.com/softonic/axios-retry?tab=readme-ov-file#options
     */
    constructor(config) {
        this.logger = config.logger.push({ component: this.constructor.name });
        this.requester = this.#createHttpRequester(config);

        // FSPID of THIS DFSP
        this.dfspId = config.dfspId;

        // make sure we always have an api type set (default to FSPIOP)
        this.apiType = config.apiType || ApiType.FSPIOP;

        // MojaloopRequests will always have a request transformer.
        // We will use this transformer to reform requests from FSPIOP bodies/headers to alternatives
        // if config.apiType is not 'fspiop' e.g. 'iso20022' will translate requests to mojaloop ISO formats.
        // note that this is extensible for other future API flavours
        this._apiTransformer = new ApiTransformer({
            logger: this.logger,
            apiType: this.apiType,
        });

        if (config.tls.enabled) {
            this.agent = new https.Agent({
                ...config.tls.creds,
                keepAlive: true
            });

            this.transportScheme = 'https';
        }
        else {
            this.agent = http.globalAgent;
            this.transportScheme = 'http';
        }

        // flag to turn jws signing on/off
        this.jwsSign = config.jwsSign;

        // if no jwsSignPutParties config is supplied it inherits the value of config.jwsSign
        if (typeof (config.jwsSignPutParties) === 'undefined') {
            this.jwsSignPutParties = config.jwsSign;
        }
        else {
            this.jwsSignPutParties = config.jwsSignPutParties;
        }

        if (this.jwsSign) {
            this.jwsSigner = new JwsSigner({
                logger: config.logger,
                signingKey: config.jwsSigningKey
            });
        }

        this.resourceVersions = {
            parties: {
                contentVersion: '1.0',
                acceptVersion: '1',
            },
            participants: {
                contentVersion: '1.0',
                acceptVersion: '1',
            },
            quotes: {
                contentVersion: '1.0',
                acceptVersion: '1',
            },
            bulkQuotes: {
                contentVersion: '1.0',
                acceptVersion: '1',
            },
            bulkTransfers: {
                contentVersion: '1.0',
                acceptVersion: '1',
            },
            transactionRequests: {
                contentVersion: '1.0',
                acceptVersion: '1',
            },
            authorizations: {
                contentVersion: '1.0',
                acceptVersion: '1',
            },
            [RESOURCES.fxQuotes]: {
                contentVersion: '2.0',
                acceptVersion: '2',
            },
            [RESOURCES.fxTransfers]: {
                contentVersion: '2.0',
                acceptVersion: '2',
            },
            transfers: {
                contentVersion: '1.0',
                acceptVersion: '1',
            },
            custom: {
                contentVersion: '1.0',
                acceptVersion: '1',
            },
            thirdparty: {
                contentVersion: '1.0',
                acceptVersion: '1',
            },
            services: {
                contentVersion: '1.0',
                acceptVersion: '1',
            },
            ...config.resourceVersions
        };

        this.peerEndpoint = `${this.transportScheme}://${config.peerEndpoint}`;
        this.resourceEndpoints = {
            parties: formatEndpointOrDefault(config.alsEndpoint, this.transportScheme, this.peerEndpoint),
            participants: formatEndpointOrDefault(config.alsEndpoint, this.transportScheme, this.peerEndpoint),
            quotes: formatEndpointOrDefault(config.quotesEndpoint, this.transportScheme, this.peerEndpoint),
            bulkQuotes: formatEndpointOrDefault(config.bulkQuotesEndpoint, this.transportScheme, this.peerEndpoint),
            transfers: formatEndpointOrDefault(config.transfersEndpoint, this.transportScheme, this.peerEndpoint),
            bulkTransfers: formatEndpointOrDefault(config.bulkTransfersEndpoint, this.transportScheme, this.peerEndpoint),
            transactionRequests: formatEndpointOrDefault(config.transactionRequestsEndpoint, this.transportScheme, this.peerEndpoint),
            authorizations: formatEndpointOrDefault(config.transactionRequestsEndpoint, this.transportScheme, this.peerEndpoint),
            [RESOURCES.fxQuotes]: formatEndpointOrDefault(config.fxQuotesEndpoint, this.transportScheme, this.peerEndpoint),
            [RESOURCES.fxTransfers]: formatEndpointOrDefault(config.fxTransfersEndpoint, this.transportScheme, this.peerEndpoint),
            thirdparty: formatEndpointOrDefault(config.thirdpartyRequestsEndpoint, this.transportScheme, this.peerEndpoint),
            services: formatEndpointOrDefault(config.servicesEndpoint, this.transportScheme, this.peerEndpoint),
        };

        this.wso2 = config.wso2 || {}; // default to empty object such that properties will be undefined
    }

    _request(opts, responseType) {
        const __request = async (opts, responseType, attempts) => this.requester.sendRequest(opts)
            .catch((err) => {
                const retryAuth = err.status === 401 &&
                    this.wso2.auth &&
                    attempts < this.wso2.retryWso2AuthFailureTimes;
                if (retryAuth) {
                    this.logger.warn('Received HTTP 401 for request. Attempting to retrieve a new token.');
                    const token = this.wso2.auth.refreshToken();
                    if (token) {
                        opts.headers['Authorization'] = `Bearer ${token}`;
                    } else {
                        const msg = 'Unable to retrieve WSO2 auth token';
                        this.logger.isDebugEnabled && this.logger.push({ attempts, opts }).debug(msg);
                        throw new Error(msg);
                    }
                    this.logger.isDebugEnabled && this.logger.push({ attempts, opts }).debug('Retrying request with new WSO2 token.');
                    return __request(opts, responseType, attempts + 1);
                } else {
                    throw err;
                }
            });

        const { method, uri, headers } = opts;
        this.logger.isVerboseEnabled && this.logger.push({ method, uri, headers }).verbose(`Executing HTTP ${method}...`);

        // if (this.httpConfig) opts.httpConfig = this.httpConfig;
        // if (this.retryConfig) opts.retryConfig = this.retryConfig;

        return __request(opts, responseType, 0)
            .then((res) => (responseType === ResponseType.Mojaloop) ? throwOrJson(res) : res)
            .catch((err) => {
                this.logger.isWarnEnabled && this.logger
                    .push({ err, opts: { ...opts, agent: '[REDACTED]' } })
                    .warn('Error attempting request');
                throw err;
            });
    }

    /**
     * @function _get
     * @description
     *  Perform a HTTP GET request.
     *
     *  **Note**: `config.jwsSign` is ignored here, as we don't JWS sign requests with no body
     * @param {string} url - The url of the resource
     * @param {string} resourceType - The 'type' of resource. Used to resolve the endpoint for the request
     * @param {string | undefined} dest - The destination participant. Leave empty if participant is unknown (e.g. `GET /parties`)
     * @param {*} headers - Optional additional headers
     * @param {*} query - Optional query parameters
     * @param {*} responseType - Optional, defaults to `Mojaloop`
     */
    async _get(url, resourceType, dest, headers = {}, query = {}, responseType = ResponseType.Mojaloop) {
        const reqOpts = {
            method: 'GET',
            uri: buildUrl(this._pickPeerEndpoint(resourceType), url),
            headers: {
                ...this._buildHeaders('GET', resourceType, dest),
                ...headers,
            },
            qs: query,
            agent: this.agent,
        };

        if (responseType === ResponseType.Stream) {
            reqOpts.responseType = this.requester.responseType.Stream;
        }

        // Note we do not JWS sign requests with no body i.e. GET requests
        return this._request(reqOpts, responseType);
    }

    /**
     * @function _put
     * @description
     *  Perform a HTTP PUT request.
     *
     * @param {string} url - The url of the resource
     * @param {string} resourceType - The 'type' of resource, as defined in the Mojaloop specification
     * @param {Object} body
     * @param {string | undefined} dest - The destination participant. Leave empty if participant is unknown (e.g. `GET /parties`)
     * @param {Object} headers - Optional additional headers
     * @param {*} query - Optional query parameters
     * @param {*} responseType - Optional, defaults to `Mojaloop`
     * @param {Object} transformParams
     */
    async _put(url, resourceType, body, dest, headers = {}, query = {},
        responseType = ResponseType.Mojaloop, transformParams = {}) {
        const reqOpts = {
            method: 'PUT',
            uri: buildUrl(this._pickPeerEndpoint(resourceType), url),
            headers: {
                ...this._buildHeaders('PUT', resourceType, dest),
                ...headers,
            },
            body: body,
            qs: query,
            agent: this.agent,
        };

        // transform the request. This will only change the request if translation is required i.e. if this.apiType is not 'fspiop'
        const transformed = await this._apiTransformer.transformOutboundRequest(resourceType, reqOpts.method, {
            body: reqOpts.body,
            headers: reqOpts.headers,
            params: transformParams,
            isError: transformParams.isError,
            $context: transformParams.$context
        });
        reqOpts.body = transformed.body;
        reqOpts.headers = { ...reqOpts.headers, ...transformed.headers };

        if (responseType === ResponseType.Stream) {
            reqOpts.responseType = this.requester.responseType.Stream;
        }

        if ((responseType === ResponseType.Mojaloop) && this.jwsSign && (resourceType === 'parties' ? this.jwsSignPutParties : true)) {
            this.jwsSigner.sign(reqOpts);
        }

        return this._request(reqOpts, responseType);
    }

    /**
     * @function _patch
     * @description
     *  Perform a HTTP PATCH request.
     *
     * @param {string} url - The url of the resource
     * @param {string} resourceType - The 'type' of resource, as defined in the Mojaloop specification
     * @param body
     * @param {string | undefined} dest - The destination participant. Leave empty if participant is unknown (e.g. `GET /parties`)
     * @param {Object} headers - Optional additional headers
     * @param {*} query - Optional query parameters
     * @param {*} responseType - Optional, defaults to `Mojaloop`
     * @param {Object} transformParams
     */
    async _patch(url, resourceType, body, dest, headers = {}, query = {},
        responseType = ResponseType.Mojaloop, transformParams = {}) {
        const reqOpts = {
            method: 'PATCH',
            uri: buildUrl(this._pickPeerEndpoint(resourceType), url),
            headers: {
                ...this._buildHeaders('PATCH', resourceType, dest),
                ...headers,
            },
            body: body,
            qs: query,
            agent: this.agent,
        };

        // transform the request. This will only change the request if translation is required i.e. if this.apiType is not 'fspiop'
        const transformed = await this._apiTransformer.transformOutboundRequest(resourceType, reqOpts.method,
            { body: reqOpts.body, headers: reqOpts.headers, params: transformParams });
        reqOpts.body = transformed.body;
        reqOpts.headers = { ...reqOpts.headers, ...transformed.headers };

        if ((responseType === ResponseType.Mojaloop) && this.jwsSign) {
            this.jwsSigner.sign(reqOpts);
        }

        return this._request(reqOpts, responseType);
    }

    /**
     * @function _post
     * @description
     *  Perform a HTTP POST request.
     *
     * @param {string} url - The url of the resource
     * @param {string} resourceType - The 'type' of resource, as defined in the Mojaloop specification
     * @param {object} body - The 'body' of the POST request
     * @param {string | undefined} dest - The destination participant. Leave empty if participant is unknown (e.g. `GET /parties`)
     * @param {*} headers - Optional additional headers
     * @param {*} query - Optional query parameters
     * @param {*} responseType - Optional, defaults to `Mojaloop`
     * @param {Object} transformParams
     */
    async _post(url, resourceType, body, dest, headers = {}, query = {},
        responseType = ResponseType.Mojaloop, transformParams = {}) {
        const reqOpts = {
            method: 'POST',
            uri: buildUrl(this._pickPeerEndpoint(resourceType), url),
            headers: {
                ...this._buildHeaders('POST', resourceType, dest),
                ...headers,
            },
            body: body,
            qs: query,
            agent: this.agent,
        };

        // transform the request. This will only change the request if translation is required i.e. if this.apiType is not 'fspiop'
        const transformed = await this._apiTransformer.transformOutboundRequest(resourceType, reqOpts.method, {
            body: reqOpts.body,
            headers: reqOpts.headers,
            params: transformParams,
            $context: transformParams.$context
        });
        reqOpts.body = transformed.body;
        reqOpts.headers = { ...reqOpts.headers, ...transformed.headers };

        if (responseType === ResponseType.Stream) {
            reqOpts.responseType = this.requester.responseType.Stream;
        }

        if ((responseType === ResponseType.Mojaloop) && this.jwsSign) {
            this.jwsSigner.sign(reqOpts);
        }

        return this._request(reqOpts, responseType);
    }

    /**
     * @function _delete
     * @description
     *  Performs a HTTP DELETE request.
     *
     *  **Note**: `config.jwsSign` is ignored here, as we don't JWS sign requests with no body
     * @param {string} url - The url of the resource
     * @param {string} resourceType - The 'type' of resource. Used to resolve the endpoint for the request
     * @param {string | undefined} dest - The destination participant. Leave empty if participant is unknown
     * @param {*} headers - Optional additional headers
     * @param {*} query - Optional query parameters
     * @param {*} responseType - Optional, defaults to `Mojaloop`
     */
    async _delete(url, resourceType, dest, headers = {}, query = {}, responseType = ResponseType.Mojaloop) {
        const reqOpts = {
            method: 'DELETE',
            uri: buildUrl(this._pickPeerEndpoint(resourceType), url),
            headers: {
                ...this._buildHeaders('DELETE', resourceType, dest),
                ...headers,
            },
            qs: query,
            agent: this.agent,
        };

        return this._request(reqOpts, responseType);
    }

    /**
     * @function _buildHeaders
     * @description
     *   Utility function for building outgoing request headers as required by the mojaloop api spec
     * @param {'GET' | 'POST' | 'PUT'} method The HTTP Method
     * @param {string} resourceType - The 'type' of resource, as defined in the Mojaloop specification
     * @param {string | undefined} dest - The destination participant. Leave empty if participant is unknown (e.g. `GET /parties`)
     *
     * @returns {*} headers object for use in requests to mojaloop api endpoints
     */
    _buildHeaders(method, resourceType, dest) {
        const apiType = defineApiType(resourceType, this.apiType);
        const isoPart = apiType === ApiType.ISO20022
            ? `.${ISO_20022_HEADER_PART}`
            : '';

        let headers = {
            'content-type': `application/vnd.interoperability${isoPart}.${resourceType}+json;version=${this.resourceVersions[resourceType].contentVersion}`,
            'date': new Date().toUTCString(),
        };

        if (this.dfspId) {
            headers['fspiop-source'] = this.dfspId;
        }

        if (dest) {
            headers['fspiop-destination'] = dest;
        }

        //Need to populate Bearer Token if we are in OAuth2.0 environment
        if (this.wso2.auth) {
            const token = this.wso2.auth.getToken();
            if(token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        // dont add accept header to PUT requests
        if(method.toUpperCase() !== 'PUT') {
            // if we are sending ISO we should "accept" it also
            headers['accept'] = `application/vnd.interoperability${isoPart}.${resourceType}+json;version=${this.resourceVersions[resourceType].acceptVersion}`;
        }

        return headers;
    }

    /**
     * @function _pickPeerEndpoint
     * @description Utility function for picking up the right endpoint based on the resourceType
     * @param {string} resourceType - The 'type' of resource, as defined in the Mojaloop specification
     * @returns {string} The endpoint fot the given `resourceType`. If an endpoint can't be found, defaults to the peerEndpoint
     */
    _pickPeerEndpoint(resourceType) {
        return this.resourceEndpoints[resourceType] || this.peerEndpoint;
    }

    /** @returns {AxiosHttpRequester} */
    #createHttpRequester({ httpConfig, retryConfig }) {
        const { logger } = this;
        return createHttpRequester({ logger, httpConfig, retryConfig });
    }
}


module.exports = BaseRequests;

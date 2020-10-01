'use strict';

const util = require('util');
const http = require('http');
const https = require('https');

const {
    bodyStringifier,
    buildUrl,
    formatEndpointOrDefault,
    ResponseType,
    throwOrJson,
} = require('./common');

const request = require('../request');
const JwsSigner = require('../jws').signer;

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
     * @function constructor
     * @param {Object} config - The Config Object
     * @param {Object} config.logger Logging function
     * @param {Object} config.tls The tls config object
     * @param {string} config.dfspId The `FSPID` of _this_ DFSP/Participant
     * @param {boolean} config.jwsSign If `true`, then requests will be JWS signed
     * @param {boolean | undefined} config.jwsSignPutParties Optional. If undefined,
     *    it will default to the value of `config.jwsSign`
     * @param {string | undefined} config.jwsSigningKey Optional. The jwsSigningKey
     *   to use. Required if `jwsSign === true`
     * @param {Object | undefined} config.wso2Auth Optional. The wso2Auth object.
     */
    constructor(config) {
        this.logger = config.logger;

        // FSPID of THIS DFSP
        this.dfspId = config.dfspId;

        if (config.tls.mutualTLS.enabled) {
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
            ...{
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
                }
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
            thirdparty: formatEndpointOrDefault(config.thirdpartyRequestsEndpoint, this.transportScheme, this.peerEndpoint),
        };

        this.wso2Auth = config.wso2Auth;
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
        };

        if (responseType === ResponseType.Stream) {
            reqOpts.responseType = request.responseType.Stream;
        }

        // Note we do not JWS sign requests with no body i.e. GET requests

        this.logger.log(`Executing HTTP GET: ${util.inspect(reqOpts)}`);
        return request({ ...reqOpts, agent: this.agent })
            .then((res) => (responseType === ResponseType.Mojaloop) ? throwOrJson(res) : res)
            .catch(e => {
                this.logger.log('Error attempting GET. URL:', url, 'Opts:', reqOpts, 'Error:', e);
                throw e;
            });
    }

    /**
     * @function _put
     * @description
     *  Perform a HTTP PUT request.
     *
     * @param {string} url - The url of the resource
     * @param {string} resourceType - The 'type' of resource, as defined in the Mojaloop specification
     * @param {string | undefined} dest - The destination participant. Leave empty if participant is unknown (e.g. `GET /parties`)
     * @param {Object} headers - Optional additional headers
     * @param {*} query - Optional query parameters
     * @param {*} responseType - Optional, defaults to `Mojaloop`
     */
    async _put(url, resourceType, body, dest, headers = {}, query = {}, responseType = ResponseType.Mojaloop) {
        const reqOpts = {
            method: 'PUT',
            uri: buildUrl(this._pickPeerEndpoint(resourceType), url),
            headers: {
                ...this._buildHeaders('PUT', resourceType, dest),
                ...headers,
            },
            body: body,
            qs: query,
        };

        if (responseType === ResponseType.Stream) {
            reqOpts.responseType = request.responseType.Stream;
        }

        if ((responseType === ResponseType.Mojaloop) && this.jwsSign && (resourceType === 'parties' ? this.jwsSignPutParties : true)) {
            this.jwsSigner.sign(reqOpts);
        }

        reqOpts.body = bodyStringifier(reqOpts.body);

        this.logger.log(`Executing HTTP PUT: ${util.inspect(reqOpts)}`);
        return request({ ...reqOpts, agent: this.agent })
            .then((res) => (responseType === ResponseType.Mojaloop) ? throwOrJson(res) : res)
            .catch(e => {
                this.logger.log('Error attempting PUT. URL:', url, 'Opts:', reqOpts, 'Body:', body, 'Error:', e);
                throw e;
            });
    }
    
    /**
     * @function _patch
     * @description
     *  Perform a HTTP PATCH request.
     *
     * @param {string} url - The url of the resource
     * @param {string} resourceType - The 'type' of resource, as defined in the Mojaloop specification
     * @param {string | undefined} dest - The destination participant. Leave empty if participant is unknown (e.g. `GET /parties`)
     * @param {Object} headers - Optional additional headers
     * @param {*} query - Optional query parameters
     * @param {*} responseType - Optional, defaults to `Mojaloop`
     */
    async _patch(url, resourceType, body, dest, headers = {}, query = {}, responseType = ResponseType.Mojaloop) {
        const reqOpts = {
            method: 'PATCH',
            uri: buildUrl(this._pickPeerEndpoint(resourceType), url),
            headers: {
                ...this._buildHeaders('PATCH', resourceType, dest),
                ...headers,
            },
            body: body,
            qs: query,
        };


        if ((responseType === ResponseType.Mojaloop) && this.jwsSign) {
            this.jwsSigner.sign(reqOpts);
        }

        reqOpts.body = bodyStringifier(reqOpts.body);

        this.logger.log(`Executing HTTP PATCH: ${util.inspect(reqOpts)}`);
        return request({ ...reqOpts, agent: this.agent })
            .then((res) => (responseType === ResponseType.Mojaloop) ? throwOrJson(res) : res)
            .catch(e => {
                this.logger.log('Error attempting PATCH. URL:', url, 'Opts:', reqOpts, 'Body:', body, 'Error:', e);
                throw e;
            });
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
     */
    async _post(url, resourceType, body, dest, headers = {}, query = {}, responseType = ResponseType.Mojaloop) {
        const reqOpts = {
            method: 'POST',
            uri: buildUrl(this._pickPeerEndpoint(resourceType), url),
            headers: {
                ...this._buildHeaders('POST', resourceType, dest),
                ...headers,
            },
            body: body,
            qs: query,
        };

        if (responseType === ResponseType.Stream) {
            reqOpts.responseType = request.responseType.Stream;
        }

        if ((responseType === ResponseType.Mojaloop) && this.jwsSign) {
            this.jwsSigner.sign(reqOpts);
        }

        reqOpts.body = bodyStringifier(reqOpts.body);

        this.logger.log(`Executing HTTP POST: ${util.inspect(reqOpts)}`);
        return request({ ...reqOpts, agent: this.agent })
            .then((res) => (responseType === ResponseType.Mojaloop) ? throwOrJson(res) : res)
            .catch(e => {
                this.logger.log('Error attempting POST. URL:', url, 'Opts:', reqOpts, 'Body:', body, 'Error:', e);
                throw e;
            });
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
        let headers = {
            'content-type': `application/vnd.interoperability.${resourceType}+json;version=${this.resourceVersions[resourceType].contentVersion}`,
            'date': new Date().toUTCString(),
        };

        if (this.dfspId) {
            headers['fspiop-source'] = this.dfspId;
        }

        if(dest) {
            headers['fspiop-destination'] = dest;
        }

        //Need to populate Bearer Token if we are in OAuth2.0 environment
        if (this.wso2Auth) {
            const token = this.wso2Auth.getToken();
            if(token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        // dont add accept header to PUT requests
        if(method.toUpperCase() !== 'PUT') {
            headers['accept'] = `application/vnd.interoperability.${resourceType}+json;version=${this.resourceVersions[resourceType].acceptVersion}`;
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
}


module.exports = BaseRequests;

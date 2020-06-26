'use strict';

const util = require('util');
const http = require('http');
const https = require('https');

const common = require('./common');
const request = require('../request');
const buildUrl = common.buildUrl;
const throwOrJson = common.throwOrJson;

const JwsSigner = require('../jws').signer;

const ResponseType = Object.freeze({
    Mojaloop: Symbol('mojaloop'),
    Simple: Symbol('simple'),
    Stream: Symbol('stream')
});

/**
 *
 * @class BaseRequests
 * @description BaseRequests is a 'mojaloop aware' class for
 *   mojaloop or thirdparty requests. It factors out the bits
 *   that 'need to know' about config
 */
class BaseRequests {

    // TODO: information on the config object
    constructor(config) {
        this.logger = config.logger;

        // TODO: a better name (nowadays) would be participantId...
        // FSPID of THIS DFSP
        this.dfspId = config.dfspId;

        if (config.tls.outbound.mutualTLS.enabled) {
            this.agent = new https.Agent({
                ...config.tls.outbound.creds,
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

        this.jwsSigner = new JwsSigner({
            logger: config.logger,
            signingKey: config.jwsSigningKey
        });

        // Switch or peer DFSP endpoint
        // TODO: factor out and clean up
        this.peerEndpoint = `${this.transportScheme}://${config.peerEndpoint}`;
        this.alsEndpoint = config.alsEndpoint ? `${this.transportScheme}://${config.alsEndpoint}` : null;
        this.quotesEndpoint = config.quotesEndpoint ? `${this.transportScheme}://${config.quotesEndpoint}` : null;
        this.bulkQuotesEndpoint = config.bulkQuotesEndpoint ? `${this.transportScheme}://${config.bulkQuotesEndpoint}` : null;
        this.transfersEndpoint = config.transfersEndpoint ? `${this.transportScheme}://${config.transfersEndpoint}` : null;
        this.bulkTransfersEndpoint = config.bulkTransfersEndpoint ? `${this.transportScheme}://${config.bulkTransfersEndpoint}` : null;
        this.transactionRequestsEndpoint = config.transactionRequestsEndpoint ? `${this.transportScheme}://${config.transactionRequestsEndpoint}` : null;

        this.wso2Auth = config.wso2Auth;
    }

    async _get(url, resourceType, dest, headers = {}, query = {}, responseType = ResponseType.Mojaloop) {
        const reqOpts = {
            method: 'GET',
            uri: buildUrl(this.pickPeerEndpoint(resourceType), url),
            headers: {
                ...this.buildHeaders('GET', resourceType, dest),
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

        reqOpts.body = common.bodyStringifier(reqOpts.body);

        this.logger.log(`Executing HTTP PUT: ${util.inspect(reqOpts)}`);
        return request({ ...reqOpts, agent: this.agent })
            .then((res) => (responseType === ResponseType.Mojaloop) ? throwOrJson(res) : res)
            .catch(e => {
                this.logger.log('Error attempting PUT. URL:', url, 'Opts:', reqOpts, 'Body:', body, 'Error:', e);
                throw e;
            });
    }


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

        reqOpts.body = common.bodyStringifier(reqOpts.body);

        this.logger.log(`Executing HTTP POST: ${util.inspect(reqOpts)}`);
        return request({ ...reqOpts, agent: this.agent })
            .then((res) => (responseType === ResponseType.Mojaloop) ? throwOrJson(res) : res)
            .catch(e => {
                this.logger.log('Error attempting POST. URL:', url, 'Opts:', reqOpts, 'Body:', body, 'Error:', e);
                throw e;
            });
    }

    /**
     * Utility function for building outgoing request headers as required by the mojaloop api spec
     *
     * @returns {object} - headers object for use in requests to mojaloop api endpoints
     */
    _buildHeaders(method, resourceType, dest) {
        let headers = {
            'content-type': `application/vnd.interoperability.${resourceType}+json;version=1.0`,
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
            headers['accept'] = `application/vnd.interoperability.${resourceType}+json;version=1.0`;
        }

        return headers;
    }

    /**
     * Utility function for picking up the right endpoint based on the resourceType
     */
    pickPeerEndpoint(resourceType) {
        // TODO: refactor to remove the need for all the damn question marks?
        switch (resourceType) {
            case 'parties': return this.alsEndpoint ? this.alsEndpoint : this.peerEndpoint;
            case 'participants': return this.alsEndpoint ? this.alsEndpoint : this.peerEndpoint;
            case 'quotes': return this.quotesEndpoint ? this.quotesEndpoint : this.peerEndpoint;
            case 'bulkQuotes': return this.bulkQuotesEndpoint ? this.bulkQuotesEndpoint : this.peerEndpoint;
            case 'transfers': rerurn this.transfersEndpoint ? this.transfersEndpoint : this.peerEndpoint;
            case 'bulkTransfers': return this.bulkTransfersEndpoint ? this.bulkTransfersEndpoint : this.peerEndpoint;
            case 'transactionRequests': return this.transactionRequestsEndpoint ? this.transactionRequestsEndpoint : this.peerEndpoint;
            case 'authorizations': return this.transactionRequestsEndpoint ? this.transactionRequestsEndpoint : this.peerEndpoint;
            case 'thirdparty': return this.thirdpartyRequestsEndpoint ?
            default:
                return this.peerEndpoint;
        }
    }

}


module.exports = BaseRequests;

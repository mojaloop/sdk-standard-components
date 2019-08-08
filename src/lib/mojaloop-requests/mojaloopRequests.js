/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - james.bush@modusbox.com                             *
 **************************************************************************/

'use strict';


const util = require('util');
const request = require('request-promise-native');

const http = require('http');
const https = require('https');

const common = require('./common.js');
const buildUrl = common.buildUrl;
const throwOrJson = common.throwOrJson;

const JwsSigner = require('../jws').signer;


/**
 * A class for making outbound requests with mutually authenticated TLS and JWS signing
 */
class MojaloopRequests {
    constructor(config) {
        this.config = config;
        this.logger = config.logger;

        // FSPID of THIS DFSP
        this.dfspId = config.dfspId;

        if(config.tls.mutualTLS.enabled) {
            this.agent = new https.Agent({
                ...config.tls.outboundCreds,
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

        this.jwsSigner = new JwsSigner({
            logger: config.logger,
            signingKey: config.jwsSigningKey
        });

        // Switch or peer DFSP endpoint
        this.peerEndpoint = `${this.transportScheme}://${config.peerEndpoint}`;
    }


    /**
     * Executes a GET /parties request for the specified identifier type and identifier 
     *
     * @returns {object} - JSON response body if one was received
     */
    async getParties(idType, idValue) {
        return this._get(`parties/${idType}/${idValue}`, 'parties');
    }


    /**
     * Executes a PUT /parties request for the specified identifier type and indentifier
     */
    async putParties(idType, idValue, body, destFspId) {
        return this._put(`parties/${idType}/${idValue}`, 'parties', body, destFspId);
    }


    /**
     * Executes a PUT /parties/{IdType}/{IdValue}/error request for the specified identifier type and indentifier
     */
    async putPartiesError(idType, idValue, error, destFspId) {
        return this._put(`parties/${idType}/${idValue}/error`, 'parties', error, destFspId);
    }


    /**
     * Executes a PUT /participants request for the specified identifier type and indentifier
     */
    async putParticipants(idType, idValue, body, destFspId) {
        return this._put(`participants/${idType}/${idValue}`, 'participants', body, destFspId);
    }


    /**
     * Executes a PUT /participants/{idType}/{idValue}/error request for the specified identifier type and indentifier
     */
    async putParticipantsError(idType, idValue, error, destFspId) {
        return this._put(`participants/${idType}/${idValue}/error`, 'participants', error, destFspId);
    }


    /**
     * Executes a POST /quotes request for the specified quote request
     *
     * @returns {object} - JSON response body if one was received
     */
    async postQuotes(quoteRequest, destFspId) {
        return this._post('quotes', 'quotes', quoteRequest, destFspId);
    }


    /**
     * Executes a PUT /quotes/{ID} request for the specified quote
     */
    async putQuotes(quoteId, quoteResponse, destFspId) {
        return this._put(`quotes/${quoteId}`, 'quotes', quoteResponse, destFspId);
    }


    /**
     * Executes a PUT /quotes/{ID} request for the specified quote
     */
    async putQuotesError(quoteId, error, destFspId) {
        return this._put(`quotes/${quoteId}/error`, 'quotes', error, destFspId);
    }
    

    /**
     * Executes a POST /transfers request for the specified transfer prepare
     *
     * @returns {object} - JSON response body if one was received
     */
    async postTransfers(prepare, destFspId) {
        return this._post('transfers', 'transfers', prepare, destFspId);
    }


    /**
     * Executes a PUT /transfers/{ID} request for the specified transfer fulfilment
     *
     * @returns {object} - JSON response body if one was received
     */
    async putTransfers(transferId, fulfilment, destFspId) {
        return this._put(`transfers/${transferId}`, 'transfers', fulfilment, destFspId);
    }


    /**
     * Executes a PUT /transfers/{ID}/error request for the specified error
     *
     * @returns {object} - JSON response body if one was received
     */
    async putTransfersError(transferId, error, destFspId) {
        return this._put(`transfers/${transferId}/error`, 'transfers', error, destFspId);
    }
 

    /**
     * Utility function for building outgoing request headers as required by the mojaloop api spec
     *
     * @returns {object} - headers object for use in requests to mojaloop api endpoints
     */
    _buildHeaders (method, resourceType, dest) {
        let headers = {
            'content-type': `application/vnd.interoperability.${resourceType}+json;version=1.0`,
            'date': new Date().toUTCString(),
            'fspiop-source': this.dfspId
        };

        if(dest) {
            headers['fspiop-destination'] = dest;
        }

        // dont add accept header to PUT requests
        if(method.toUpperCase() !== 'PUT') {
            headers['accept'] = `application/vnd.interoperability.${resourceType}+json;version=1.0`;
        }

        return headers;
    }


    async _get(url, resourceType, dest) {
        const reqOpts = {
            method: 'GET',
            uri: buildUrl(this.peerEndpoint, url),
            headers: this._buildHeaders('GET', resourceType, dest),
            agent: this.agent,
            resolveWithFullResponse: true,
            simple: false 
        };

        // Note we do not JWS sign requests with no body i.e. GET requests

        try {
            this.logger.log(`Executing HTTP GET: ${util.inspect(reqOpts)}`);
            return await request(reqOpts).then(throwOrJson);
        }
        catch (e) {
            this.logger.log('Error attempting GET. URL:', url, 'Opts:', reqOpts, 'Error:', e);
            throw e;
        }
    }


    async _put(url, resourceType, body, dest) {
        const reqOpts = {
            method: 'PUT',
            uri: buildUrl(this.peerEndpoint, url),
            headers: this._buildHeaders('PUT', resourceType, dest),
            body: body,
            agent: this.agent,
            resolveWithFullResponse: true,
            simple: false
        };

        if(this.jwsSign) {
            this.jwsSigner.sign(reqOpts);
        }

        try {
            this.logger.log(`Executing HTTP PUT: ${util.inspect(reqOpts)}`);
            return await request(reqOpts).then(throwOrJson);
        }
        catch (e) {
            this.logger.log('Error attempting PUT. URL:', url, 'Opts:', reqOpts, 'Body:', body, 'Error:', e);
            throw e;
        }
    }


    async _post(url, resourceType, body, dest) {
        const reqOpts = {
            method: 'POST',
            uri: buildUrl(this.peerEndpoint, url),
            headers: this._buildHeaders('POST', resourceType, dest),
            body: body,
            agent: this.agent,
            resolveWithFullResponse: true,
            simple: false
        };

        if(this.jwsSign) {
            this.jwsSigner.sign(reqOpts);
        }

        try {
            this.logger.log(`Executing HTTP POST: ${util.inspect(reqOpts)}`);
            return await request(reqOpts).then(throwOrJson);
        }
        catch (e) {
            this.logger.log('Error attempting POST. URL:', url, 'Opts:', reqOpts, 'Body:', body, 'Error:', e);
            throw e;
        }
    }
}



module.exports = MojaloopRequests;

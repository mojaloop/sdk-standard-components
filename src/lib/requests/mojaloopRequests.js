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


const BaseRequests = require('./baseRequests');

const { ResponseType } = require('./common');

/**
 * @class MojaloopRequests
 * @description A class for making outbound requests with mutually authenticated TLS and JWS signing
 */
class MojaloopRequests extends BaseRequests {
    constructor(config) {
        super(config);
    }

    /**
     * Executes a GET /parties request for the specified identifier type and identifier
     *
     * @returns {object} - JSON response body if one was received
     */
    async getParties(idType, idValue, idSubValue) {
        const url = `parties/${idType}/${idValue}`
            + (idSubValue ? `/${idSubValue}` : '');
        return this._get(url, 'parties');
    }

    /**
     * Executes a PUT /parties request for the specified identifier type and indentifier
     */
    async putParties(idType, idValue, idSubValue, body, destFspId) {
        const url = `parties/${idType}/${idValue}`
            + (idSubValue ? `/${idSubValue}` : '');
        return this._put(url, 'parties', body, destFspId);
    }

    /**
     * Executes a PUT /parties/{IdType}/{IdValue}/error request for the specified identifier type and indentifier
     */
    async putPartiesError(idType, idValue, idSubValue, error, destFspId) {
        const url = `parties/${idType}/${idValue}`
            + (idSubValue ? `/${idSubValue}` : '')
            + '/error';
        return this._put(url, 'parties', error, destFspId);
    }

    /**
     * Executes a POST /participants request
     *
     * @returns {object} - JSON response body if one was received
     */
    async postParticipants(request, destFspId) {
        return this._post('participants', 'participants', request, destFspId);
    }

    /**
     * Executes a PUT /participants request for the specified identifier type and indentifier
     */
    async putParticipants(idType, idValue, idSubValue, body, destFspId) {
        const url = `participants/${idType}/${idValue}`
            + (idSubValue ? `/${idSubValue}` : '');
        return this._put(url, 'participants', body, destFspId);
    }

    /**
     * Executes a PUT /participants/{idType}/{idValue}/error request for the specified identifier type and indentifier
     */
    async putParticipantsError(idType, idValue, idSubValue, error, destFspId) {
        const url = `participants/${idType}/${idValue}`
            + (idSubValue ? `/${idSubValue}` : '')
            + '/error';
        return this._put(url, 'participants', error, destFspId);
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
     * Executes a POST /bulkQuotes request
     */
    async postBulkQuotes(bulkQuoteRequest, destFspId) {
        return this._post('bulkQuotes', 'bulkQuotes', bulkQuoteRequest, destFspId);
    }

    /**
    * Executes a PUT /bulkQuotes/{ID} request for the specified bulk quotes
    */
    async putBulkQuotes(bulkQuoteId, bulkQuoteResponse, destFspId) {
        return this._put(`bulkQuotes/${bulkQuoteId}`, 'bulkQuotes', bulkQuoteResponse, destFspId);
    }

    /**
    * Executes a PUT /bulkQuotes/{ID} request for the specified bulk quotes
    */
    async putBulkQuotesError(bulkQuoteId, error, destFspId) {
        return this._put(`bulkQuotes/${bulkQuoteId}/error`, 'bulkQuotes', error, destFspId);
    }

    /**
     * Executes a GET /bulkQuotes/{ID} request for the specified bulk quote ID
     *
     * @returns {object} - JSON response body if one was received
     */
    async getBulkQuotes(bulkQuoteId) {
        const url = `bulkQuotes/${bulkQuoteId}`;
        return this._get(url, 'bulkQuotes');
    }

    /**
     * Executes a GET /transfers request for the specified transfer ID
     *
     * @returns {object} - JSON response body if one was received
     */
    async getTransfers(transferId) {
        const url = `transfers/${transferId}`;
        return this._get(url, 'transfers');
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
     * Executes a GET /bulkTransfers/{ID} request for the specified bulk transfer ID
     *
     * @returns {object} - JSON response body if one was received
     */
    async getBulkTransfers(bulkTransferId) {
        const url = `bulkTransfers/${bulkTransferId}`;
        return this._get(url, 'bulkTransfers');
    }

    /**
     * Executes a POST /bulkTransfers request for the specified bulk transfer prepare
     *
     * @returns {object} - JSON response body if one was received
     */
    async postBulkTransfers(prepare, destFspId) {
        return this._post('bulkTransfers', 'bulkTransfers', prepare, destFspId);
    }

    /**
     * Executes a PUT /bulkTransfers/{ID} request for the specified bulk transfer fulfilment
     *
     * @returns {object} - JSON response body if one was received
     */
    async putBulkTransfers(bulkTransferId, fulfilment, destFspId) {
        return this._put(`bulkTransfers/${bulkTransferId}`, 'bulkTransfers', fulfilment, destFspId);
    }

    /**
     * Executes a PUT /bulkTransfers/{ID}/error request for the specified error
     *
     * @returns {object} - JSON response body if one was received
     */
    async putBulkTransfersError(bulkTransferId, error, destFspId) {
        return this._put(`bulkTransfers/${bulkTransferId}/error`, 'bulkTransfers', error, destFspId);
    }

    /**
     * Executes a POST /transactionRequests request for the specified transaction request
     *
     * @returns {object} - JSON response body if one was received
     */
    async postTransactionRequests(transactionRequest, destFspId) {
        return this._post('transactionRequests', 'transactionRequests', transactionRequest, destFspId);
    }

    /**
     * Executes a PUT /transactionRequests/{ID} request for the specified transaction request
     *
     * @returns {object} - JSON response body if one was received
     */
    async putTransactionRequests(transactionRequestId, transactionRequestResponse, destFspId) {
        return this._put(`transactionRequests/${transactionRequestId}`, 'transactionRequests', transactionRequestResponse, destFspId);
    }

    /**
     * Executes a PUT /transactionRequests/{ID}/error request for the specified error
     *
     * @returns {object} - JSON response body if one was received
     */
    async putTransactionRequestsError(transactionRequestId, error, destFspId) {
        return this._put(`transactionRequests/${transactionRequestId}/error`, 'transactionRequests', error, destFspId);
    }

    /**
     * Executes a GET /authorizations request for the specified transactionRequestId
     *
     * @returns {object} - JSON response body if one was received
     */
    async getAuthorizations(transactionRequestId, authorizationParameters, destFspId) {
        const url = `authorizations/${transactionRequestId}?${authorizationParameters}`;
        return this._get(url , 'authorizations', destFspId);
    }

    /**
     * Executes a PUT /authorizations/{ID} request for the specified transactionRequestId
     *
     * @returns {object} - JSON response body if one was received
     */
    async putAuthorizations(transactionRequestId, authorizationResponse, destFspId) {
        return this._put(`authorizations/${transactionRequestId}`, 'authorizations', authorizationResponse, destFspId);
    }

    /**
     * Executes a PUT /authorizations/{ID}/error request for the specified transactionRequestId
     *
     * @returns {object} - JSON response body if one was received
     */
    async putAuthorizationsError(transactionRequestId, error, destFspId) {
        return this._put(`authorizations/${transactionRequestId}/error`, 'authorizations', error, destFspId);
    }

    async putCustom(url, body, headers, query, streamResponse = false) {
        return this._put(url, 'custom', body, null, headers, query,
            streamResponse ? ResponseType.Stream : ResponseType.Simple);
    }

    async postCustom(url, body, headers, query, streamResponse = false) {
        return this._post(url, 'custom', body, null, headers, query,
            streamResponse ? ResponseType.Stream : ResponseType.Simple);
    }

    async getCustom(url, headers, query, streamResponse = false) {
        return this._get(url, 'custom', null, headers, query,
            streamResponse ? ResponseType.Stream : ResponseType.Simple);
    }
}

module.exports = MojaloopRequests;

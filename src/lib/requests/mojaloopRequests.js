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
 - Name Surname <name.surname@mojaloop.io>

 * ModusBox
 - James Bush - james.bush@modusbox.com - ORIGINAL AUTHOR

 --------------
 ******/

'use strict';

const { RESOURCES } = require('../constants');
const { ResponseType } = require('./common');
const BaseRequests = require('./baseRequests');

/**
 * @class MojaloopRequests
 * @description A class for making outbound requests with mutually authenticated TLS and JWS signing
 */
class MojaloopRequests extends BaseRequests {
    constructor(config) {
        super(config);

        this._config = config;
    }

    /**
     * Executes a GET /parties request for the specified identifier type and identifier
     *
     * @returns {object} - JSON response body if one was received
     */
    async getParties(idType, idValue, idSubValue, destFspId, headers) {
        const url = `parties/${idType}/${idValue}`
            + (idSubValue ? `/${idSubValue}` : '');

        return this._get(url, 'parties', destFspId, headers);
    }

    /**
     * Executes a PUT /parties request for the specified identifier type and indentifier
     */
    async putParties(idType, idValue, idSubValue, body, destFspId, headers) {
        const url = `parties/${idType}/${idValue}`
            + (idSubValue ? `/${idSubValue}` : '');
        return this._put(url, 'parties', body, destFspId, headers, undefined,
            undefined, { Type: idType, ID: idValue, SubId: idSubValue });
    }

    /**
     * Executes a PUT /parties/{IdType}/{IdValue}/error request for the specified identifier type and indentifier
     */
    async putPartiesError(idType, idValue, idSubValue, error, destFspId) {
        const url = `parties/${idType}/${idValue}`
            + (idSubValue ? `/${idSubValue}` : '')
            + '/error';
        return this._put(url, 'parties', error, destFspId, undefined,undefined,
            undefined, { Type: idType, ID: idValue, SubId: idSubValue, isError: true });
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
        return this._put(url, 'participants', body, destFspId, undefined, undefined,
            undefined, { Type: idType, ID: idValue, SubId: idSubValue});
    }

    /**
     * Executes a PUT /participants/{idType}/{idValue}/error request for the specified identifier type and indentifier
     */
    async putParticipantsError(idType, idValue, idSubValue, error, destFspId) {
        const url = `participants/${idType}/${idValue}`
            + (idSubValue ? `/${idSubValue}` : '')
            + '/error';
        return this._put(url, 'participants', error, destFspId, undefined, undefined,
            undefined, { Type: idType, ID: idValue, SubId: idSubValue, isError: true });
    }

    /**
     * Executes a DELETE /participants/{idType}/{idValue}/{idSubValue} request for the specified identifier type and indentifier 
     * and (optionally) sub identifier
     */
    async deleteParticipants(idType, idValue, idSubValue, destFspId) {
        const url = `participants/${idType}/${idValue}`
            + (idSubValue ? `/${idSubValue}` : '');
        return this._delete(url, 'participants', destFspId);
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
    async putQuotes(quoteId, quoteResponse, destFspId,  headers, $context) {
        return this._put(`quotes/${quoteId}`, 'quotes', quoteResponse, destFspId, headers,
            undefined, undefined, { ID: quoteId, $context });
    }


    /**
     * Executes a PUT /quotes/{ID} request for the specified quote
     */
    async putQuotesError(quoteId, error, destFspId) {
        return this._put(`quotes/${quoteId}/error`, 'quotes', error, destFspId, undefined,
            undefined, undefined, { ID: quoteId, isError: true });
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
    async postTransfers(prepare, destFspId, $context) {
        return this._post('transfers', 'transfers', prepare, destFspId,
            undefined, undefined, undefined, { $context });
    }

    /**
     * Executes a PUT /transfers/{ID} request for the specified transfer fulfilment
     *
     * @returns {object} - JSON response body if one was received
     */
    async putTransfers(transferId, fulfilment, destFspId, headers) {
        return this._put(`transfers/${transferId}`, 'transfers', fulfilment, destFspId, headers);
    }

    /**
     * Executes a PATCH /transfers/{ID} request for the specified transfer update
     *
     * @returns {object} - JSON response body if one was received
     */
    async patchTransfers(transferId, body, destFspId) {
        return this._patch(`transfers/${transferId}`, 'transfers', body, destFspId);
    }

    /**
     * Executes a PUT /transfers/{ID}/error request for the specified error
     *
     * @returns {object} - JSON response body if one was received
     */
    async putTransfersError(transferId, error, destFspId) {
        return this._put(`transfers/${transferId}/error`, 'transfers', error, destFspId,
            undefined, undefined, undefined, { isError: true });
    }

    /**
   * Executes a POST /fxQuotes request for the specified fxQuote request
   *
   * @returns {object} - JSON response body if one was received
   */
    async postFxQuotes(quotePayload, destFspId) {
        return this._post('fxQuotes', RESOURCES.fxQuotes, quotePayload, destFspId);
    }

    /**
   * Executes a PUT /fxQuotes/{ID} request for the specified fxQuote
   *
   * @returns {object} - JSON response body if one was received
   */
    async putFxQuotes(conversionRequestId, fxQuoteResponse, destFspId) {
        return this._put(`fxQuotes/${conversionRequestId}`, RESOURCES.fxQuotes, fxQuoteResponse, destFspId);
    }

    /**
   * Executes a PUT /fxQuotes/{ID}/error request for the specified error
   *
   * @returns {object} - JSON response body if one was received
   */
    async putFxQuotesError(conversionRequestId, error, destFspId) {
        return this._put(`fxQuotes/${conversionRequestId}/error`, RESOURCES.fxQuotes, error, destFspId,
            undefined, undefined, undefined, { isError: true });
    }

    /**
     * Executes a POST /fxTransfers request for the specified fxTransfer prepare
     *
     * @returns {object} - JSON response body if one was received
     */
    async postFxTransfers(preparePayload, destFspId) {
        return this._post('fxTransfers', RESOURCES.fxTransfers, preparePayload, destFspId);
    }

    /**
     * Executes a PUT /fxTransfers/{ID} request for the specified fxTransfer fulfilment
     *
     * @returns {object} - JSON response body if one was received
     */
    async putFxTransfers(commitRequestId, fulfilmentPayload, destFspId) {
        return this._put(`fxTransfers/${commitRequestId}`, RESOURCES.fxTransfers, fulfilmentPayload, destFspId);
    }

    /**
     * Executes a PUT /fxTransfers/{ID}/error request for the specified error
     *
     * @returns {object} - JSON response body if one was received
     */
    async putFxTransfersError(commitRequestId, error, destFspId) {
        return this._put(`fxTransfers/${commitRequestId}/error`, RESOURCES.fxTransfers, error, destFspId,
            undefined, undefined, undefined, { isError: true });
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
     * Executes a POST /authorizations request for the specified authorization request
     *
     * @returns {object} - JSON response body if one was received
     */
    async postAuthorizations(authorizationRequest, destFspId) {
        return this._post('authorizations', 'authorizations', authorizationRequest, destFspId);
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

'use strict';

const BaseRequests = require('./baseRequests');


/**
 * @class ThirdpartyRequests
 * @description Client library for making outbound Mojaloop requests
 *   for 3rd party functions (e.g. PISP use cases)
 */
class ThirdpartyRequests extends BaseRequests {

    /**
     * @function postAuthorizations
     * @description
     *   Executes a `POST /authorizations` request for the specified `transactionRequestId`
     * @param {string} transactionRequestId The `id` of the transactionRequest thirdpartyRequest
     * @param {Object} authorizationBody The authorizationBody
     * @param {string?} authorizationBody.thingo The authorizationBody
     *
     * @param {string} destParticipantId The id of the destination participant, in this case, a PISP
     * @returns {Promise<object>} JSON response body if one was received
     */
    async postAuthorizations(authorizationBody, destParticipantId) {
        return this._post('authorizations', 'authorizations', authorizationBody, destParticipantId);
    }

    /**
     * @function getThirdpartyRequestTransaction
     * @description
     *   Executes a `GET /thirdpartyRequest/transactions/{transactionRequestId}` request for the specified `transactionRequestId`
     * @param {string} transactionRequestId The `id` of the transactionRequest thirdpartyRequest
     * @param {string} destParticipantId The id of the destination participant, in this case, a DFSP
     * @returns {Promise<object>} JSON response body if one was received
     */
    async getThirdpartyRequestTransaction(transactionRequestId, destParticipantId) {
        const url = `thirdpartyRequest/transactions/${transactionRequestId}`;
        return this._get(url, 'thirdparty', destParticipantId);
    }

    /**
     * @function postThirdpartyRequestTransaction
     * @description
     *   Executes a `POST /thirdpartyRequest/transactions` request
     * @param {Object} thirdpartyRequestTransactionBody The thirdpartyRequestTransactionBody
     * @param {string} destParticipantId The id of the destination participant, in this case, a DFSP
     * @returns {Promise<object>} JSON response body if one was received
     */
    async postThirdpartyRequestTransaction(thirdpartyRequestTransactionBody, destParticipantId) {
        const url = 'thirdpartyRequest/transactions';
        return this._post(url, 'thirdparty', thirdpartyRequestTransactionBody, destParticipantId);
    }
}


module.exports = ThirdpartyRequests;

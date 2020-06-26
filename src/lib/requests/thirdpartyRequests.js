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
    // TODO: authorizationbody jsdoc...
    async postAuthorizations(transactionRequestId, authorizationBody, destParticipantId) {
        return this._post(`authorizations/${transactionRequestId}`, 'authorizations', authorizationBody, destParticipantId);
    }
}


module.exports = ThirdpartyRequests;

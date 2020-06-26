'use strict';

const BaseRequests = require('./baseRequests');


/**
 * @class ThirdpartyRequests
 * @description Client library for making outbound Mojaloop requests
 *   for 3rd party functions (e.g. PISP use cases)
 */
class ThirdpartyRequests extends BaseRequests {

    /**
     * @function constructor
     * @param {*} config
     * TODO: config definition!
     */
    constructor(config) {
        super(config);
    }

    /**
     * @function postAuthorizations
     * @description
     *   executes a POST /authorizations request for the specified `transactionRequestId`
     * @returns {object} - JSON response body if one was received
     */
    // TODO: authorizationbody jsdoc...
    async postAuthorizations(transactionRequestId, authorizationBody, destParticipantId) {
        return this._post(`authorizations/${transactionRequestId}`, 'authorizations', authorizationBody, destParticipantId);
    }

}


module.exports = ThirdpartyRequests;

'use strict';


// TODO: factor our common stuff where applicable
const util = require('util');
const http = require('http');
const https = require('https');


const BaseRequests = require('./baseRequests');
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
        return this._post(`authorizations/${transactionRequestId}`, 'authorizations', authorizationResponse, destParticipantId);
    }

}


module.exports = ThirdpartyRequests;

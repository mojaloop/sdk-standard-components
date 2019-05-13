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


/**
 * See section 7.6 of "API Definition v1.0.docx"
 */
const MojaloopApiErrorCodes = {
    //Generic communication errors
    COMMUNICATION_ERROR:              { code: '1000', message: 'Server error' },
    DESTINATION_COMMUNICATION_ERROR:  { code: '1001', message: 'Destination communication error' },

    //Generic server errors
    SERVER_ERROR:                     { code: '2000', message: 'Server error' },
    INTERNAL_SERVER_ERROR:            { code: '2001', message: 'Internal server error' },
    NOT_IMPLEMENTED:                  { code: '2002', message: 'Not implemented' },
    SERVICE_CURRENTLY_UNAVAILABLE:    { code: '2003', message: 'Service currently unavailable' },
    SERVER_TIMED_OUT:                 { code: '2004', message: 'Server timed out' },
    SERVER_BUSY:                      { code: '2005', message: 'Server busy' },

    //Generic client errors
    CLIENT_ERROR:                     { code: '3000', message: 'Client error' },
    UNACCEPTABLE_VERSION:             { code: '3001', message: 'Unacceptable version' },
    UNKNOWN_URI:                      { code: '3002', message: 'Unknown URI' },
    ADD_PARTY_INFO_ERROR:             { code: '3003', message: 'Error updating or adding party information' },

    //Client validation errors
    VALIDATION_ERROR:                 { code: '3100', message: 'Validation error' },
    MALFORMED_SYNTAX:                 { code: '3101', message: 'Malformed syntax' },
    MISSING_ELEMENT:                  { code: '3102', message: 'Missing mandatory element' },
    TOO_MANY_ELEMENTS:                { code: '3103', message: 'Too many elements' },
    TOO_LARGE_PAYLOAD:                { code: '3104', message: 'Payload too large' },
    INVALID_SIGNATURE:                { code: '3105', message: 'Invalid signature' },
    MODIFIED_REQUEST:                 { code: '3106', message: 'Modified request' },
    MISSING_MANDATORY_EXTENSION:      { code: '3107', message: 'Missing mandatory extension' },

    //identifier errors
    ID_NOT_FOUND:                     { code: '3200', message: 'ID not found' },
    DESTINATION_FSP_ERROR:            { code: '3201', message: 'Destination FSP does not exist or cannot be found' },
    PAYER_FSP_ID_NOT_FOUND:           { code: '3202', message: 'Payer FSP ID not found' },
    PAYEE_FSP_ID_NOT_FOUND:           { code: '3203', message: 'Payee FSP ID not found' },
    PARTY_NOT_FOUND:                  { code: '3204', message: 'Party not found' },
    QUOTE_ID_NOT_FOUND:               { code: '3205', message: 'Quote ID not found' },
    TXN_REQUEST_ID_NOT_FOUND:         { code: '3206', message: 'Transaction request ID not found' },
    TXN_ID_NOT_FOUND:                 { code: '3207', message: 'Transaction ID not found' },
    TRANSFER_ID_NOT_FOUND:            { code: '3208', message: 'Transfer ID not found' },
    BULK_QUOTE_ID_NOT_FOUND:          { code: '3209', message: 'Bulk quote ID not found' },
    BULK_TRANSFER_ID_NOT_FOUND:       { code: '3210', message: 'Bulk transfer ID not found' },

    //expired errors
    EXPIRED_ERROR:                    { code: '3300', message: 'Entity expired' },
    TXN_REQUEST_EXPIRED:              { code: '3301', message: 'Transaction request expired' },
    QUOTE_EXPIRED:                    { code: '3302', message: 'Quote expired' },
    TRANSFER_EXPIRED:                 { code: '3303', message: 'Transfer expired' },

    //payer errors
    PAYER_ERROR:                      { code: '4000', message: 'Error related to the Payer or Payer FSP' },
    PAYER_FSP_INSUFFICIENT_LIQUIDITY: { code: '4001', message: 'Payer FSP insufficient liquidity' },
    PAYER_REJECTION:                  { code: '4100', message: 'Payer or Payer FSP rejected the request' },
    PAYER_REJECTED_TXN_REQUEST:       { code: '4101', message: 'Payer rejected the transaction request' },
    PAYER_FSP_UNSUPPORTED_TXN_TYPE:   { code: '4102', message: 'Payer FSP does not support or rejected the transaction type' },
    PAYER_UNSUPPORTED_CURRENCY:       { code: '4103', message: 'Payer does not have an account which supports the requested currency' },
    PAYER_LIMIT_ERROR:                { code: '4200', message: 'Payer limit exceeded' },
    PAYER_PERMISSION_ERROR:           { code: '4300', message: 'Payer or Payer FSP insufficient permissions' },
    PAYER_BLOCKED_ERROR:              { code: '4400', message: 'Payer blocked' },

    //payee errors
    PAYEE_ERROR:                      { code: '5000', message: 'Error related to the payee or payee FSP' },
    PAYEE_FSP_INSUFFICIENT_LIQUIDITY: { code: '5001', message: 'Payee FSP insufficient liquidity' },
    PAYEE_REJECTION:                  { code: '5100', message: 'Payee or Payee FSP rejected the request.' },
    PAYEE_REJECTED_QUOTE:             { code: '5101', message: 'Payee rejected quote' },
    PAYEE_FSP_UNSUPPORTED_TXN_TYPE:   { code: '5102', message: 'Payee FSP does not support or rejected the transaction type' },
    PAYEE_FSP_REJECTED_QUOTE:         { code: '5103', message: 'Payee FSP rejected quote' },
    PAYEE_REJECTED_TXN:               { code: '5104', message: 'Payee rejected the transaction' },
    PAYEE_FSP_REJECTED_TXN:           { code: '5105', message: 'Payee FSP rejected the transaction.' },
    PAYEE_UNSUPPORTED_CURRENCY:       { code: '5106', message: 'Payee does not have an account which supports the requested currency.' },
    PAYEE_LIMIT_ERROR:                { code: '5200', message: 'Payee limit exceeded' },
    PAYEE_PERMISSION_ERROR:           { code: '5300', message: 'Payee or Payee FSP insufficient permissions' },
    GENERIC_PAYEE_BLOCKED_ERROR:      { code: '5400', message: 'Payee blocked' }
};


/**
 * Returns an object representing a Mojaloop API spec error object given its error code
 *
 * @param code {string} - Error code
 * @returns {object} - Object representing the Mojaloop API spec error
 */
function MojaloopApiErrorCodeFromCode(code) {
    let ec = Object.keys(MojaloopApiErrorCodes).find(ec => {
        return MojaloopApiErrorCodes[ec].code === code;
    });

    if(ec) {
        return MojaloopApiErrorCodes[ec];
    }
    return undefined;
}


/**
 * Encapsulates an error and the required information to pass is back to a client for processing
 */
class MojaloopFSPIOPError extends Error {

    /**
     * Constructs a new error object
     */
    constructor(cause, message, replyTo, apiErrorCode, extensions) {
        super(message);
        this.name = 'FSPIOPError';
        this.cause = cause;
        this.replyTo = replyTo;
        this.apiErrorCode = apiErrorCode;
        this.extensions = extensions;
    }


    /**
     * Returns an object that complies with the API specification for error bodies.
     * This can be used to serialise the error to a JSON body
     *
     * @returns {object}
     */
    toApiErrorObject() {
        let e = {
            errorInformation: {
                errorCode: this.apiErrorCode.code,
                errorDescription: this.apiErrorCode.message
            }
        };

        if(this.extensionList) {
            e.errorInformation.extensionList = this.extensions;
        }

        return e;
    }


    /**
     * Returns an object containing all details of the error e.g. for logging
     *
     * @returns {object}
     */
    toFullErrorObject() {
        return {
            message: this.message,
            replyTo: this.replyTo,
            apiErrorCode: this.apiErrorCode,
            extensions: this.extensions,
            cause: this.cause ? this.cause.stack || util.inspect(this.cause) : undefined
        };
    }
}


module.exports = {
    MojaloopApiErrorCodes: MojaloopApiErrorCodes,
    MojaloopFSPIOPError: MojaloopFSPIOPError,
    MojaloopApiErrorCodeFromCode: MojaloopApiErrorCodeFromCode
};

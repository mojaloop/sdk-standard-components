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


/** See section 7.6 of "API Definition v1.0.docx". Note that some of the these
 * error objects contain an httpStatusCode property that indicates the HTTP
 * response code for cases where errors are returned immediately i.e. upon
 * request, rather than on callback.  Those error objects that do not contain
 * an httpStatusCode property are expected to only be returned to callers in
 * error callbacks after the initial request was accepted with a 202/200.
 */
const MojaloopApiErrorCodes = {
    //Generic communication errors
    COMMUNICATION_ERROR:              { code: '1000', message: 'Communication error' },
    DESTINATION_COMMUNICATION_ERROR:  { code: '1001', message: 'Destination communication error' },

    //Generic server errors
    SERVER_ERROR:                     { code: '2000', message: 'Generic server error' },
    INTERNAL_SERVER_ERROR:            { code: '2001', message: 'Internal server error' },
    NOT_IMPLEMENTED:                  { code: '2002', message: 'Not implemented' , httpStatusCode: 501},
    SERVICE_CURRENTLY_UNAVAILABLE:    { code: '2003', message: 'Service currently unavailable', httpStatusCode: 503 },
    SERVER_TIMED_OUT:                 { code: '2004', message: 'Server timed out' },
    SERVER_BUSY:                      { code: '2005', message: 'Server busy' },

    //Generic client errors
    METHOD_NOT_ALLOWED:               { code: '3000', message: 'Generic client error - Method Not Allowed', httpStatusCode: 405 },
    CLIENT_ERROR:                     { code: '3000', message: 'Generic client error', httpStatusCode: 400 },
    UNACCEPTABLE_VERSION:             { code: '3001', message: 'Unacceptable version requested', httpStatusCode: 406 },
    UNKNOWN_URI:                      { code: '3002', message: 'Unknown URI', httpStatusCode: 404 },
    ADD_PARTY_INFO_ERROR:             { code: '3003', message: 'Add Party information error' },
    DELETE_PARTY_INFO_ERROR:          { code: '3040', message: 'Delete Party information error' }, // Error code thrown in ALS when deleting participant info fails

    //Client validation errors
    VALIDATION_ERROR:                 { code: '3100', message: 'Generic validation error', httpStatusCode: 400 },
    MALFORMED_SYNTAX:                 { code: '3101', message: 'Malformed syntax', httpStatusCode: 400 },
    MISSING_ELEMENT:                  { code: '3102', message: 'Missing mandatory element', httpStatusCode: 400 },
    TOO_MANY_ELEMENTS:                { code: '3103', message: 'Too many elements', httpStatusCode: 400 },
    TOO_LARGE_PAYLOAD:                { code: '3104', message: 'Too large payload', httpStatusCode: 400 },
    INVALID_SIGNATURE:                { code: '3105', message: 'Invalid signature', httpStatusCode: 400 },
    MODIFIED_REQUEST:                 { code: '3106', message: 'Modified request', httpStatusCode: 400 },
    MISSING_MANDATORY_EXTENSION:      { code: '3107', message: 'Missing mandatory extension parameter', httpStatusCode: 400 },

    //identifier errors
    ID_NOT_FOUND:                     { code: '3200', message: 'Generic ID not found' },
    DESTINATION_FSP_ERROR:            { code: '3201', message: 'Destination FSP Error' },
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
    EXPIRED_ERROR:                    { code: '3300', message: 'Generic expired error' },
    TXN_REQUEST_EXPIRED:              { code: '3301', message: 'Transaction request expired' },
    QUOTE_EXPIRED:                    { code: '3302', message: 'Quote expired' },
    TRANSFER_EXPIRED:                 { code: '3303', message: 'Transfer expired' },

    //payer errors
    PAYER_ERROR:                      { code: '4000', message: 'Generic Payer error' },
    PAYER_FSP_INSUFFICIENT_LIQUIDITY: { code: '4001', message: 'Payer FSP insufficient liquidity' },
    PAYER_REJECTION:                  { code: '4100', message: 'Generic Payer rejection' },
    PAYER_REJECTED_TXN_REQUEST:       { code: '4101', message: 'Payer rejected transaction request' },
    PAYER_FSP_UNSUPPORTED_TXN_TYPE:   { code: '4102', message: 'Payer FSP unsupported transaction type' },
    PAYER_UNSUPPORTED_CURRENCY:       { code: '4103', message: 'Payer unsupported currency' },
    PAYER_LIMIT_ERROR:                { code: '4200', message: 'Payer limit error' },
    PAYER_PERMISSION_ERROR:           { code: '4300', message: 'Payer permission error' },
    PAYER_BLOCKED_ERROR:              { code: '4400', message: 'Generic Payer blocked error' },

    //payee errors
    PAYEE_ERROR:                      { code: '5000', message: 'Generic Payee error' },
    PAYEE_FSP_INSUFFICIENT_LIQUIDITY: { code: '5001', message: 'Payee FSP insufficient liquidity' },
    PAYEE_REJECTION:                  { code: '5100', message: 'Generic Payee rejection' },
    PAYEE_REJECTED_QUOTE:             { code: '5101', message: 'Payee rejected quote' },
    PAYEE_FSP_UNSUPPORTED_TXN_TYPE:   { code: '5102', message: 'Payee FSP unsupported transaction type' },
    PAYEE_FSP_REJECTED_QUOTE:         { code: '5103', message: 'Payee FSP rejected quote' },
    PAYEE_REJECTED_TXN:               { code: '5104', message: 'Payee rejected transaction' },
    PAYEE_FSP_REJECTED_TXN:           { code: '5105', message: 'Payee FSP rejected transaction' },
    PAYEE_UNSUPPORTED_CURRENCY:       { code: '5106', message: 'Payee unsupported currency' },
    PAYEE_LIMIT_ERROR:                { code: '5200', message: 'Payee limit error' },
    PAYEE_PERMISSION_ERROR:           { code: '5300', message: 'Payee permission error' },
    GENERIC_PAYEE_BLOCKED_ERROR:      { code: '5400', message: 'Generic Payee blocked error' }
};


/**
 * Returns an object representing a Mojaloop API spec error object given its error code
 *
 * @param code {string} - Mojaloop API spec error code (four digit integer as string)
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

function MojaloopApiErrorObjectFromCode(ec) {
    return {
        errorInformation: {
            errorCode: ec.code,
            errorDescription: ec.message
        }
    };
}

/**
 * Encapsulates an error and the required information to pass is back to a client for processing
 */
class MojaloopFSPIOPError extends Error {

    /**
     * Constructs a new error object
     *
     * @param cause {object} - Underlying error object or any type that represents the cause of this error
     * @param message {string} - A friendly error message
     * @param replyTo {string} - FSPID of the participant to whom this error is addressed
     * @param apiErrorCode {object} - The MojaloopApiErrorCodes object representing the API spec error
     * @param extensions {object} - API spec extensions object (if applicable)
     */
    constructor(cause, message, replyTo, apiErrorCode, extensions) {
        super(message);
        this.name = 'FSPIOPError';
        this.cause = cause;
        this.replyTo = replyTo;
        this.apiErrorCode = apiErrorCode;
        this.httpStatusCode = apiErrorCode.httpStatusCode;
        this.extensions = extensions;
    }


    /**
     * Returns an object that complies with the API specification for error bodies.
     * This can be used to serialise the error to a JSON body
     *
     * @returns {object}
     */
    toApiErrorObject() {
        const e = MojaloopApiErrorObjectFromCode(this.apiErrorCode);

        if(this.extensions) {
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


    /**
     * Returns a string representation of the error
     *
     * @returns {string}
     */
    toString() {
        return `${util.inspect(this.toFullErrorObject())}`;
    }
}


module.exports = {
    MojaloopApiErrorCodes: MojaloopApiErrorCodes,
    MojaloopApiErrorObjectFromCode,
    MojaloopFSPIOPError: MojaloopFSPIOPError,
    MojaloopApiErrorCodeFromCode: MojaloopApiErrorCodeFromCode
};

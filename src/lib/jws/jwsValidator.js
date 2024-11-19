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

const base64url = require('base64url');
const jwt = require('jsonwebtoken');
const safeStringify = require('fast-safe-stringify');

// the JWS signature algorithm to use. Note that Mojaloop spec requires RS256 at present
const SIGNATURE_ALGORITHMS = ['RS256', 'ES256'];

/**
 * Provides methods for Mojaloop compliant JWS signing and signature verification
 */
class JwsValidator {
    constructor(config) {
        this.logger = config.logger || console;

        if(!config.validationKeys) {
            throw new Error('Validation keys must be supplied as config argument');
        }

        this.validationKeys = config.validationKeys;
    }


    /**
     * Validates the JWS headers on an incoming HTTP request
     * Throws if the protected header or signature are not valid
     */
    validate(request) {
        try {
            const { headers, body, data } = request;
            const payload = body || data;

            this.logger.isDebugEnabled && this.logger.debug(`Validating JWS on request with headers: ${safeStringify(headers)} and body: ${safeStringify(payload)}`);

            if(!payload) {
                throw new Error('Cannot validate JWS without a body');
            }

            // first check we have a public (validation) key for the request source
            if(!headers['fspiop-source']) {
                throw new Error('FSPIOP-Source HTTP header not in request headers. Unable to verify JWS');
            }

            const pubKey = this.validationKeys[headers['fspiop-source']];

            if(!pubKey) {
                throw new Error(`JWS public key for '${headers['fspiop-source']}' not available. Unable to verify JWS. Only have keys for: ${safeStringify(Object.keys(this.validationKeys))}`);
            }

            // first we check the required headers are present
            if(!headers['fspiop-uri'] || !headers['fspiop-http-method'] || !headers['fspiop-signature']) {
                throw new Error(`fspiop-uri, fspiop-http-method and fspiop-signature HTTP headers are all required for JWS. Only got ${safeStringify(headers)}`);
            }

            // if all required headers are present we start by extracting the components of the signature header
            const signatureHeader = JSON.parse(headers['fspiop-signature']);
            const { protectedHeader, signature } = signatureHeader;

            const token = `${protectedHeader}.${base64url(safeStringify(payload))}.${signature}`;

            this.logger.isDebugEnabled && this.logger.debug(`JWS token to verify: ${token}, pubKey: ${pubKey}`);

            // validate signature
            const result = jwt.verify(token, pubKey, {
                complete: true,
                algorithms: SIGNATURE_ALGORITHMS  //only allow our SIGNATURE_ALGORITHM
            });

            // check protected header has all required fields and matches actual incoming headers
            this._validateProtectedHeader(headers, result.header);

            // const result = jwt.verify(token, pubKey, { complete: true, json: true });
            this.logger.isDebugEnabled && this.logger.debug(`JWS verify result: ${safeStringify(result)}`);

            // all ok if we got here
            this.logger.isDebugEnabled && this.logger.debug(`JWS valid for request ${safeStringify(request)}`);
        }
        catch(err) {
            this.logger.isDebugEnabled && this.logger.debug(`Error validating JWS: ${err.stack || safeStringify(err)}`);
            throw err;
        }
    }


    /**
     * Validates the protected header and checks it against the actual request headers.
     * Throws an exception if a discrepancy is detected or validation fails.
     */
    _validateProtectedHeader(headers, decodedProtectedHeader) {
        // check alg is present and is the single permitted value
        if(!decodedProtectedHeader['alg']) {
            throw new Error(`Decoded protected header does not contain required alg element: ${safeStringify(decodedProtectedHeader)}`);
        }
        if(!SIGNATURE_ALGORITHMS.includes(decodedProtectedHeader.alg)) {
            throw new Error(`Invalid protected header alg '${decodedProtectedHeader.alg}' should be '${SIGNATURE_ALGORITHMS.join(' or ')}'`);
        }

        // check FSPIOP-URI is present and matches
        if(!decodedProtectedHeader['FSPIOP-URI']) {
            throw new Error(`Decoded protected header does not contain required FSPIOP-URI element: ${safeStringify(decodedProtectedHeader)}`);
        }
        if(!headers['fspiop-uri']) {
            throw new Error(`FSPIOP-URI HTTP header not present in request headers: ${safeStringify(headers)}`);
        }
        if(decodedProtectedHeader['FSPIOP-URI'] !== headers['fspiop-uri']) {
            throw new Error(`FSPIOP-URI HTTP request header value: ${headers['fspiop-uri']} does not match protected header value: ${decodedProtectedHeader['FSPIOP-URI']}`);
        }


        // check FSPIOP-HTTP-Method is present and matches
        if(!decodedProtectedHeader['FSPIOP-HTTP-Method']) {
            throw new Error(`Decoded protected header does not contain required FSPIOP-HTTP-Method element: ${safeStringify(decodedProtectedHeader)}`);
        }
        if(!headers['fspiop-http-method']) {
            throw new Error(`FSPIOP-HTTP-Method HTTP header not present in request headers: ${safeStringify(headers)}`);
        }
        if(decodedProtectedHeader['FSPIOP-HTTP-Method'] !== headers['fspiop-http-method']) {
            throw new Error(`FSPIOP-HTTP-Method HTTP request header value: ${headers['fspiop-http-method']} does not match protected header value: ${decodedProtectedHeader['FSPIOP-HTTP-Method']}`);
        }


        // check FSPIOP-Source is present and matches
        if(!decodedProtectedHeader['FSPIOP-Source']) {
            throw new Error(`Decoded protected header does not contain required FSPIOP-Source element: ${safeStringify(decodedProtectedHeader)}`);
        }
        if(!headers['fspiop-source']) {
            throw new Error(`FSPIOP-Source HTTP header not present in request headers: ${safeStringify(headers)}`);
        }
        if(decodedProtectedHeader['FSPIOP-Source'] !== headers['fspiop-source']) {
            throw new Error(`FSPIOP-Source HTTP request header value: ${headers['fspiop-source']} does not match protected header value: ${decodedProtectedHeader['FSPIOP-Source']}`);
        }


        // if we have a Date field in the protected header it must be present in the HTTP header and the values should match exactly
        if(decodedProtectedHeader['Date'] && !headers['date']) {
            throw new Error(`Date header is present in protected header but not in HTTP request: ${safeStringify(headers)}`);
        }
        if(decodedProtectedHeader['Date'] && (headers['date'] !== decodedProtectedHeader['Date'])) {
            throw new Error(`HTTP date header: ${headers['date']} does not match protected header Date value: ${decodedProtectedHeader['Date']}`);
        }

        // if we have an HTTP fspiop-destination header it should also be in the protected header and the values should match exactly
        if(headers['fspiop-destination'] && !decodedProtectedHeader['FSPIOP-Destination']) {
            throw new Error(`HTTP fspiop-destination header is present but is not present in protected header: ${safeStringify(decodedProtectedHeader)}`);
        }
        if(decodedProtectedHeader['FSPIOP-Destination'] && !headers['fspiop-destination']) {
            throw new Error(`FSPIOP-Destination header is present in protected header but not in HTTP request: ${safeStringify(headers)}`);
        }
        if(headers['fspiop-destination'] && (headers['fspiop-destination'] !== decodedProtectedHeader['FSPIOP-Destination'])) {
            throw new Error(`HTTP FSPIOP-Destination header: ${headers['fspiop-destination']} does not match protected header FSPIOP-Destination value: ${decodedProtectedHeader['FSPIOP-Destination']}`);
        }
    }
}


module.exports = JwsValidator;

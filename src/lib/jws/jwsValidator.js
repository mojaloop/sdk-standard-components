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
const base64url = require('base64url');
const jwt = require('jsonwebtoken');

// the JWS signature algorithm to use. Note that Mojaloop spec requires RS256 at present
const SIGNATURE_ALGORITHM = 'RS256';


/**
 * Provides methods for Mojaloop compliant JWS signing and signature verification
 */
class JwsValidator {
    constructor(config = { logger: console }) {
        this.logger = config.logger;
    }


    /**
     * Validates the JWS headers on an incoming HTTP request
     * Throws if the protected header or signature are not valid
     */
    validate(request) {
        try {
            const { headers, body } = request;

            // first we check the required headers are present 
            if(!headers['fspiop-uri'] || !headers['fspiop-http-method'] || !headers['fspiop-signature']) {
                throw new Error(`fspiop-uri, fspiop-http-method and fspiop-signature HTTP headers are all required for JWS. Only got ${util.inspect(headers)}`);
            }

            // if all required headers are present we start by checking the protected header
            const signatureHeader = JSON.parse(headers['fspiop-signature']);
            const { protectedHeader, signature } = signatureHeader;

            const decodedProtectedHeader = JSON.parse(base64url.decode(protectedHeader));
            
            this.logger.log(`Decoded protected header: ${util.inspect(decodedProtectedHeader)}`);

            // check protected header has all required fields and matches actual incoming headers
            this._validateProtectedHeader(headers, decodedProtectedHeader);

            // validate signature
            // work in progress...

            // all ok if we got here
            this.logger.log(`JWS valid for request ${request.id}`);
        }
        catch(err) {
            this.logger.log(`Error validating JWS: ${err.stack || util.inspect(err)}`);
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
            throw new Error(`Decoded protected header does not contain required alg element: ${util.inspect(decodedProtectedHeader)}`);
        }
        if(decodedProtectedHeader.alg !== SIGNATURE_ALGORITHM) {
            throw new Error(`Invalid protected header alg '${decodedProtectedHeader.alg}' should be '${SIGNATURE_ALGORITHM}'`);
        }

        // check FSPIOP-URI is present and matches
        if(!decodedProtectedHeader['FSPIOP-URI']) {
            throw new Error(`Decoded protected header does not contain required FSPIOP-URI element: ${util.inspect(decodedProtectedHeader)}`);
        }
        if(!headers['fspiop-uri']) {
            throw new Error(`FSPIOP-URI HTTP header not present in request headers: ${util.inspect(headers)}`);
        }
        if(decodedProtectedHeader['FSPIOP-URI'] !== headers['fspiop-uri']) {
            throw new Error(`FSPIOP-URI HTTP request header value: ${headers['fspiop-uri']} does not match protected header value: ${decodedProtectedHeader['FSPIOP-URI']}`);
        }
    

        // check FSPIOP-HTTP-Method is present and matches
        if(!decodedProtectedHeader['FSPIOP-HTTP-Method']) {
            throw new Error(`Decoded protected header does not contain required FSPIOP-HTTP-Method element: ${util.inspect(decodedProtectedHeader)}`);
        }
        if(!headers['fspiop-http-method']) {
            throw new Error(`FSPIOP-HTTP-Method HTTP header not present in request headers: ${util.inspect(headers)}`);
        }
        if(decodedProtectedHeader['FSPIOP-HTTP-Method'] !== headers['fspiop-http-method']) {
            throw new Error(`FSPIOP-HTTP-Method HTTP request header value: ${headers['fspiop-http-method']} does not match protected header value: ${decodedProtectedHeader['FSPIOP-HTTP-Method']}`);
        }


        // check FSPIOP-Source is present and matches
        if(!decodedProtectedHeader['FSPIOP-Source']) {
            throw new Error(`Decoded protected header does not contain required FSPIOP-Source element: ${util.inspect(decodedProtectedHeader)}`);
        }
        if(!headers['fspiop-source']) {
            throw new Error(`FSPIOP-Source HTTP header not present in request headers: ${util.inspect(headers)}`);
        }
        if(decodedProtectedHeader['FSPIOP-Source'] !== headers['fspiop-source']) {
            throw new Error(`FSPIOP-Source HTTP request header value: ${headers['fspiop-source']} does not match protected header value: ${decodedProtectedHeader['FSPIOP-Source']}`);
        }


        // if we have an HTTP date header it should also be in the protected header and the values should match exactly
        if(headers['date'] && !decodedProtectedHeader['Date']) {
            throw new Error(`HTTP date header is present but is not present in protected header: ${util.inspect(decodedProtectedHeader)}`); 
        }
        if(headers['date'] !== decodedProtectedHeader['Date']) {
            throw new Error(`HTTP date header: ${headers['date']} does not match protected header Date value: ${decodedProtectedHeader['Date']}`);
        }


    }
}


module.exports = JwsValidator;

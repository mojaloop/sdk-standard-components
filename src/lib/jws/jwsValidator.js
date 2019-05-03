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


/**
 * Provides methods for Mojaloop compliant JWS signing and signature verification
 */
class JwsValidator {
    constructor(config = { logger: console }) {
        this.logger = config.logger;
    }


    /**
     * Validates the JWS headers on an incoming HTTP request
     * Throws if the signature is not valid
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

            // check protected header matches actual incoming headers
            // work in progress...

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

    _validateProtectedHeader(headers, decodedProtectedHeader) {
        // check all required properties are present on the protected signature
        if(!decodedProtectedHeader.alg) {
            throw new Error(`Decoded protected header does not contain required alg element: ${util.inspect(header)}`);
        }
    }
}


module.exports = JwsValidator;

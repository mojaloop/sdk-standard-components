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
const url = require('url');
const base64url = require('base64url');
const jwt = require('jsonwebtoken');


/**
 * Provides methods for Mojaloop compliant JWS signing and signature verification
 */
class JwsSigner {
    constructor(config = { logger: console }) {
        this.logger = config.logger;

        if(!config.signingKey) {
            throw new Error('Signing key must be supplied as config argument');
        }

        this.signingKey = config.signingKey;
    }


    /**
     * Adds JWS headers to an outgoing HTTP request options object
     *
     * @param requestOptions {object} a request-promise-native request options object (see https://github.com/request/request-promise-native)
     */
    sign(requestOptions) {
        this.logger.log(`JWS Signing request: ${util.inspect(requestOptions)}`);

        // add required JWS headers to the request options
        requestOptions.headers['fspiop-http-method'] = requestOptions.method.toUpperCase();
        requestOptions.headers['fspiop-uri'] = url.parse(requestOptions.uri).pathname;

        // generate the protected header as base64url encoding of UTF-8 encoding of JSON string

        // Note: Property names are case sensitive in the protected header object even though they are
        // not case sensitive in the actual HTTP headers
        const protectedHeaderObject = {
            alg: 'RS256',
            'FSPIOP-URI': requestOptions.headers['fspiop-uri'],
            'FSPIOP-HTTP-Method': requestOptions.headers['fspiop-http-method'],
            'FSPIOP-Source': requestOptions.headers['fspiop-source']
        };

        // set destination in the protected header object if it is present in the request headers
        if(requestOptions.headers['fspiop-destination']) {
            protectedHeaderObject['fspiop-destination'] = requestOptions.headers['fspiop-destination'];
        }

        // set date in the protected header object if it is present in the request headers
        if(requestOptions.headers['date']) {
            protectedHeaderObject['date'] = requestOptions.headers['date'];
        }

        // get a base64url encoding of a UTF-8 version of the protected header JSON
        // we first encode the string into a buffer explicitly as UTF-8
        const protectedHeaderBase64 = base64url(Buffer.from(JSON.stringify(protectedHeaderObject), 'utf8'), 'utf8');

        // generate the signature.

        // we might have an empty body (e.g. for a GET request) so start with an empty buffer
        let bodyBytes = Buffer.alloc(0);        

        if(requestOptions.body) {
            // if we have a body, use JSON.stringify to turn it into its JSON representation, whatever that may be
            bodyBytes = Buffer.from(JSON.stringify(requestOptions.body), 'utf8');
        }

        // now we can base64url encode the body
        const bodyBase64 = base64url(bodyBytes, 'utf8');

        // now we sign the two strings, concatenated thus: "protectedHeaderBase64.bodyBase64"
        const signature = jwt.sign(`${protectedHeaderBase64}.${bodyBase64}`, this.signingKey);
        
        // now set the signature header as JSON encoding of the signature and protected header as per mojaloop spec
        const signatureObject = {
            signature: signature,
            protectedHeader: protectedHeaderBase64
        };

        requestOptions.headers['fspiop-signature'] = JSON.stringify(signatureObject);

        //now if we had a body, replace it with the bytestream we signed, to make sure it gets encoded/serialised correctly across the wire
        if(requestOptions.body) {
            requestOptions.body = bodyBytes;
        }
        requestOptions.json = false;
    }
}


module.exports = JwsSigner;

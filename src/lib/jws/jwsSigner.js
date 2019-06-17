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
const jws = require('jws');

// the JWS signature algorithm to use. Note that Mojaloop spec requires RS256 at present
const SIGNATURE_ALGORITHM = 'RS256';

// a regular expression to extract the Mojaloop API spec compliant HTTP-URI header value
const uriRegex = /(?:^.*)(\/(participants|parties|quotes|transfers)(\/.*)*)$/;


/**
 * Provides methods for Mojaloop compliant JWS signing and signature verification
 */
class JwsSigner {
    constructor(config) {
        this.logger = config.logger || console;

        if(!config.signingKey) {
            throw new Error('Signing key must be supplied as config argument');
        }

        this.signingKey = config.signingKey;
    }


    /**
     * Adds JWS headers to an outgoing HTTP request options object
     *
     * @param requestOptions {object} a request-promise-native request options object
     *   (see https://github.com/request/request-promise-native)
     */
    sign(requestOptions) {
        this.logger.log(`JWS Signing request: ${util.inspect(requestOptions)}`);

        if(!requestOptions.body) {
            throw new Error('Cannot sign with no body');
        }

        const uriMatches = uriRegex.exec(requestOptions.uri);
        if(!uriMatches || uriMatches.length < 2) {
            throw new Error(`URI not valid for protected header: ${requestOptions.uri}`);
        }

        // add required JWS headers to the request options
        requestOptions.headers['fspiop-http-method'] = requestOptions.method.toUpperCase();
        requestOptions.headers['fspiop-uri'] = uriMatches[1];

        // generate the protected header as base64url encoding of UTF-8 encoding of JSON string

        // Note: Property names are case sensitive in the protected header object even though they are
        // not case sensitive in the actual HTTP headers
        const protectedHeaderObject = {
            alg: SIGNATURE_ALGORITHM,
            'FSPIOP-URI': requestOptions.headers['fspiop-uri'],
            'FSPIOP-HTTP-Method': requestOptions.headers['fspiop-http-method'],
            'FSPIOP-Source': requestOptions.headers['fspiop-source']
        };

        // set destination in the protected header object if it is present in the request headers
        if(requestOptions.headers['fspiop-destination']) {
            protectedHeaderObject['FSPIOP-Destination'] = requestOptions.headers['fspiop-destination'];
        }

        // set date in the protected header object if it is present in the request headers
        if(requestOptions.headers['date']) {
            protectedHeaderObject['Date'] = requestOptions.headers['date'];
        }

        // now we sign
        const token = jws.sign({
            header: protectedHeaderObject,
            payload: requestOptions.body,
            secret: this.signingKey,
            encoding: 'utf8'});

        // now set the signature header as JSON encoding of the signature and protected header as per mojaloop spec
        const [ protectedHeaderBase64, , signature ] = token.split('.');

        const signatureObject = {
            signature: signature.replace('"', ''),
            protectedHeader: protectedHeaderBase64.replace('"', '')
        };

        requestOptions.headers['fspiop-signature'] = JSON.stringify(signatureObject);

        requestOptions.body = JSON.stringify(requestOptions.body);
    }
}


module.exports = JwsSigner;

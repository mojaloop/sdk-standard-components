/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 * ModusBox
 - James Bush - james.bush@modusbox.com - ORIGINAL AUTHOR

 --------------
 ******/

'use strict';

const jws = require('jws');
const crypto = require('node:crypto');
const base64url = require('base64url');
const safeStringify = require('fast-safe-stringify');

const uriRegex = /(?:^.*)(\/(participants|parties|quotes|bulkQuotes|transfers|bulkTransfers|transactionRequests|thirdpartyRequests|authorizations|consents|consentRequests|fxQuotes|fxTransfers|)(\/.*)*)$/;
// const uriRegex = \/\/(participants|parties|quotes|bulkQuotes|transfers|bulkTransfers|transactionRequests|thirdpartyRequests|authorizations|consents|consentRequests|fxQuotes|fxTransfers|)(?:$|\\/.*$)\/;

// Algorithms that rely on Node.js post-quantum support (ML-DSA per JOSE PQC draft)
const PQ_SIGNATURE_ALGORITHMS = ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'];

/**
 * Provides methods for Mojaloop compliant JWS signing and signature verification
 */
class JwsSigner {
    constructor (config) {
        this.logger = config.logger?.child({ component: this.constructor.name }) || console;

        if (!config.signingKey) {
            throw new Error('Signing key must be supplied as config argument');
        }

        // The JWS signature algorithm to use.
        // - If config.alg is provided, use it directly (e.g. 'ML-DSA-65').
        // - Otherwise, for string/Buffer keys, infer ES256 vs RS256 from PEM header.
        // - For non-string keys (e.g. KeyObject), default to RS256 unless overridden.
        if (config.alg) {
            this.alg = config.alg;
        } else if (typeof config.signingKey === 'string' || Buffer.isBuffer(config.signingKey)) {
            this.alg = config.signingKey.includes('BEGIN EC ') ? 'ES256' : 'RS256';
        } else {
            this.alg = 'RS256';
        }

        if (PQ_SIGNATURE_ALGORITHMS.includes(this.alg)) {
            // Ensure runtime Node.js version has ML-DSA support (Node >= 24.7.0)
            const [major, minor] = process.versions.node.split('.').map((v) => parseInt(v, 10));
            const hasPqcSupport = (major > 24) || (major === 24 && minor >= 7);
            if (!hasPqcSupport) {
                throw new Error(`Post-quantum JWS algorithm '${this.alg}' requires Node.js >= 24.7.0. Current version: ${process.versions.node}`);
            }
        }

        this.signingKey = config.signingKey;
    }

    /**
     * Adds JWS headers to an outgoing HTTP request options object
     *
     * @param requestOptions {object} a request-promise-native/axios style request options object
     *   (see https://github.com/request/request-promise-native)
     *   (see https://github.com/axios/axios)
     */
    sign (requestOptions) {
        this.logger.isDebugEnabled && this.logger.debug(`JWS Signing request: ${safeStringify(requestOptions)}`);
        const payload = requestOptions.body || requestOptions.data;
        const uri = requestOptions.uri || requestOptions.url;

        if (!payload) {
            throw new Error('Cannot sign with no body');
        }

        const uriMatches = uriRegex.exec(uri);
        if (!uriMatches || uriMatches.length < 2) {
            throw new Error(`URI not valid for protected header: ${uri}`);
        }

        // add required JWS headers to the request options
        requestOptions.headers['fspiop-http-method'] = requestOptions.method.toUpperCase();
        requestOptions.headers['fspiop-uri'] = uriMatches[1];

        // get the signature and add it to the header
        requestOptions.headers['fspiop-signature'] = this.getSignature(requestOptions);

        if (requestOptions.body && typeof requestOptions.body !== 'string') {
            requestOptions.body = safeStringify(requestOptions.body);
        }
        if (requestOptions.data && typeof requestOptions.data !== 'string') {
            requestOptions.data = safeStringify(requestOptions.data);
        }
    }

    /**
     * Returns JWS signature for an outgoing HTTP request options object
     *
     * @param requestOptions {object} a request-promise-native/axios style request options object
     *   (see https://github.com/request/request-promise-native)
     *   (see https://github.com/axios/axios)
     *
     * @returns {string} - JWS Signature as a string
    */
    getSignature (requestOptions) {
        this.logger.isDebugEnabled && this.logger.debug(`Get JWS Signature: ${safeStringify(requestOptions)}`);
        const payload = requestOptions.body || requestOptions.data;
        const uri = requestOptions.uri || requestOptions.url;

        if (!payload) {
            throw new Error('Cannot sign with no body');
        }

        const uriMatches = uriRegex.exec(uri);
        if (!uriMatches || uriMatches.length < 2) {
            throw new Error(`URI not valid for protected header: ${uri}`);
        }

        // generate the protected header as base64url encoding of UTF-8 encoding of JSON string

        // Note: Property names are case sensitive in the protected header object even though they are
        // not case sensitive in the actual HTTP headers
        const protectedHeaderObject = {
            alg: this.alg,
            'FSPIOP-URI': requestOptions.headers['fspiop-uri'],
            'FSPIOP-HTTP-Method': requestOptions.method.toUpperCase(),
            'FSPIOP-Source': requestOptions.headers['fspiop-source']
        };

        // set destination in the protected header object if it is present in the request headers
        if (requestOptions.headers['fspiop-destination']) {
            protectedHeaderObject['FSPIOP-Destination'] = requestOptions.headers['fspiop-destination'];
        }

        // set date in the protected header object if it is present in the request headers
        if (requestOptions.headers.date) {
            protectedHeaderObject.Date = requestOptions.headers.date;
        }

        // For PQC algorithms we bypass the jws library and sign using Node.js crypto directly.
        if (PQ_SIGNATURE_ALGORITHMS.includes(this.alg)) {
            const protectedHeaderJson = safeStringify(protectedHeaderObject);
            const protectedHeaderBase64 = base64url(protectedHeaderJson);

            const payloadString = typeof payload === 'string' ? payload : safeStringify(payload);
            const payloadBase64 = base64url(payloadString);
            const signingInput = Buffer.from(`${protectedHeaderBase64}.${payloadBase64}`, 'utf8');

            // For ML-DSA keys, crypto.sign/verify are invoked with a null algorithm and
            // the algorithm is derived from the key material itself.
            const signatureBuffer = crypto.sign(null, signingInput, this.signingKey);
            const signatureBase64 = base64url(signatureBuffer);

            const signatureObject = {
                signature: signatureBase64,
                protectedHeader: protectedHeaderBase64
            };

            return safeStringify(signatureObject);
        }

        // For classical algorithms we delegate to the jws library as before.
        const token = jws.sign({
            header: protectedHeaderObject,
            payload,
            secret: this.signingKey,
            encoding: 'utf8'
        });

        // now set the signature header as JSON encoding of the signature and protected header as per mojaloop spec
        const [protectedHeaderBase64, , signature] = token.split('.');

        const signatureObject = {
            signature: signature.replace('"', ''),
            protectedHeader: protectedHeaderBase64.replace('"', '')
        };

        return safeStringify(signatureObject);
    }
}

module.exports = JwsSigner;

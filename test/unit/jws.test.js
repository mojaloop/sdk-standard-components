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

const fs = require('fs');
const crypto = require('node:crypto');
const JwsTest = require('../../src/lib/jws');
const Signer = JwsTest.signer;
const Validator = JwsTest.validator;
const mockLogger = require('../__mocks__/mockLogger');

const signingKey = fs.readFileSync(__dirname + '/data/jwsSigningKey.pem');
const validationKey = fs.readFileSync(__dirname + '/data/jwsValidationKey.pem');

// Detect whether the current Node.js runtime has ML-DSA post-quantum support enabled.
const hasMlDsaSupport = (() => {
    try {
        const [major, minor] = process.versions.node.split('.').map((v) => parseInt(v, 10));
        if (Number.isNaN(major) || Number.isNaN(minor)) return false;
        // ML-DSA key pairs are supported from Node.js v24.6.0 upwards.
        if (major < 24 || (major === 24 && minor < 6)) {
            return false;
        }

        // Quick runtime probe: try to generate a key pair and sign / verify once.
        const { publicKey, privateKey } = crypto.generateKeyPairSync('ml-dsa-44');
        const message = Buffer.from('ml-dsa self-test');
        const signature = crypto.sign(null, message, privateKey);
        return crypto.verify(null, message, publicKey, signature);
    } catch {
        return false;
    }
})();

describe('JWS', () => {
    let signer;
    let testOpts;
    let testOptsData;
    let body;

    beforeEach(() => {
        signer = new Signer({
            signingKey,
            logger: mockLogger({ app: 'jws-test' }, undefined)
        });
        body = { test: 123 };
        // An request-promise-native style request uses the `.uri` and `.body` properties instead of the `.url` and `.data` properties.
        testOpts = {
            headers: {
                'fspiop-source': 'mojaloop-sdk',
                'fspiop-destination': 'some-other-fsp',
                date: new Date().toISOString()
            },
            method: 'PUT',
            uri: 'https://someswitch.com:443/prefix/parties/MSISDN/12345678',
            body
        };
        // An axios-style request uses the `.url` and `.data` properties instead of the `.uri` and `.body` properties.
        testOptsData = {
            headers: {
                'fspiop-source': 'mojaloop-sdk',
                'fspiop-destination': 'some-other-fsp',
                date: new Date().toISOString()
            },
            method: 'PUT',
            url: 'https://someswitch.com:443/prefix/parties/MSISDN/12345678',
            data: body
        };
    });

    function testValidateSignedRequest (shouldFail) {
        const request = {
            headers: testOpts.headers,
            body
        };

        const validate = () => {
            const validator = new Validator({
                validationKeys: {
                    'mojaloop-sdk': validationKey
                },
                logger: mockLogger({ app: 'validate-test' }, undefined)
            });
            validator.validate(request);
        };

        if (shouldFail) {
            expect(validate).toThrow();
        } else {
            validate();
        }
    }

    function testValidateSignedRequestData (shouldFail) {
        const request = {
            headers: testOptsData.headers,
            data: body
        };

        const validate = () => {
            const validator = new Validator({
                validationKeys: {
                    'mojaloop-sdk': validationKey
                },
                logger: mockLogger({ app: 'validate-test' }, undefined)
            });
            validator.validate(request);
        };

        if (shouldFail) {
            expect(validate).toThrow();
        } else {
            validate();
        }
    }

    test('Should generate valid JWS headers and signature for request with body', () => {
        signer.sign(testOpts);

        expect(testOpts.headers['fspiop-signature']).toBeTruthy();
        expect(testOpts.headers['fspiop-uri']).toBe('/parties/MSISDN/12345678');
        expect(testOpts.headers['fspiop-http-method']).toBe('PUT');

        testValidateSignedRequest(false);
    });

    (hasMlDsaSupport ? test : test.skip)('Should generate valid JWS headers and signature for request with body using ML-DSA-44', () => {
        const { publicKey: pqPublicKey, privateKey: pqPrivateKey } = crypto.generateKeyPairSync('ml-dsa-44');

        const pqSigner = new Signer({
            signingKey: pqPrivateKey,
            logger: mockLogger({ app: 'jws-pqc-test' }, undefined),
            alg: 'ML-DSA-44'
        });

        const pqValidator = new Validator({
            validationKeys: {
                'mojaloop-sdk': pqPublicKey
            },
            logger: mockLogger({ app: 'validate-pqc-test' }, undefined)
        });

        const pqBody = { test: 456 };
        const pqOpts = {
            headers: {
                'fspiop-source': 'mojaloop-sdk',
                'fspiop-destination': 'some-other-fsp',
                date: new Date().toISOString()
            },
            method: 'PUT',
            uri: 'https://someswitch.com:443/prefix/parties/MSISDN/99999999',
            body: pqBody
        };

        pqSigner.sign(pqOpts);

        expect(pqOpts.headers['fspiop-signature']).toBeTruthy();
        expect(pqOpts.headers['fspiop-uri']).toBe('/parties/MSISDN/99999999');
        expect(pqOpts.headers['fspiop-http-method']).toBe('PUT');

        const pqRequest = {
            headers: pqOpts.headers,
            body: pqBody
        };

        // This should exercise the PQC validation path in JwsValidator.
        const validate = () => pqValidator.validate(pqRequest);
        validate();
    });

    test('Should generate valid JWS headers and signature for request with data', () => {
        signer.sign(testOptsData);

        expect(testOptsData.headers['fspiop-signature']).toBeTruthy();
        expect(testOptsData.headers['fspiop-uri']).toBe('/parties/MSISDN/12345678');
        expect(testOptsData.headers['fspiop-http-method']).toBe('PUT');

        testValidateSignedRequestData(false);
    });

    test('getSignature Should return valid JWS signature for request with body', () => {
        testOpts.headers['fspiop-uri'] = '/parties/MSISDN/12345678';
        testOpts.headers['fspiop-http-method'] = 'PUT';
        const signature = signer.getSignature(testOpts);
        testOpts.headers['fspiop-signature'] = signature;

        expect(signature).toBeTruthy();
        testValidateSignedRequest(false);
    });

    test('getSignature Should return valid JWS signature for request with data', () => {
        testOptsData.headers['fspiop-uri'] = '/parties/MSISDN/12345678';
        testOptsData.headers['fspiop-http-method'] = 'PUT';
        const signature = signer.getSignature(testOptsData);
        testOptsData.headers['fspiop-signature'] = signature;

        expect(signature).toBeTruthy();
        testValidateSignedRequestData(false);
    });

    test('Should throw when trying to sign with no body', () => {
        delete testOpts.body;

        expect(() => {
            signer.sign(testOpts);
        }).toThrow();
    });

    test('getSignature Should throw when trying to sign with no body', () => {
        delete testOpts.body;
        testOpts.headers['fspiop-uri'] = '/parties/MSISDN/12345678';
        testOpts.headers['fspiop-http-method'] = 'PUT';

        expect(() => {
            signer.getSignature(testOpts);
        }).toThrow();
    });

    test('getSignature Should throw when trying to sign with no body(data)', () => {
        delete testOptsData.data;
        testOptsData.headers['fspiop-uri'] = '/parties/MSISDN/12345678';
        testOptsData.headers['fspiop-http-method'] = 'PUT';

        expect(() => {
            signer.getSignature(testOptsData);
        }).toThrow();
    });

    test('Should throw when trying to sign with no body(data)', () => {
        delete testOptsData.data;

        expect(() => {
            signer.sign(testOptsData);
        }).toThrow();
    });

    test('Should throw when trying to sign with no uri', () => {
        delete testOpts.uri;

        expect(() => {
            signer.sign(testOpts);
        }).toThrow();
    });

    test('getSignature Should throw when trying to sign with no uri', () => {
        delete testOpts.uri;

        expect(() => {
            signer.getSignature(testOpts);
        }).toThrow();
    });

    test('Should throw when trying to sign with no url', () => {
        delete testOptsData.url;

        expect(() => {
            signer.sign(testOptsData);
        }).toThrow();
    });

    test('getSignature Should throw when trying to sign with no url', () => {
        delete testOptsData.url;

        expect(() => {
            signer.getSignature(testOptsData);
        }).toThrow();
    });

    test('Should throw when trying to validate with no body', () => {
        signer.sign(testOpts);
        delete testOpts.body;
        body = undefined;
        testValidateSignedRequest(true);
    });

    test('Should throw when trying to validate with no body(data)', () => {
        signer.sign(testOptsData);
        delete testOptsData.data;
        body = undefined;
        testValidateSignedRequestData(true);
    });

    test('Should throw when trying to validate with no fspiop-signature header', () => {
        signer.sign(testOpts);
        delete testOpts.headers['fspiop-signature'];
        testValidateSignedRequest(true);
    });

    test('Should throw when trying to validate with no fspiop-uri header', () => {
        signer.sign(testOpts);
        delete testOpts.headers['fspiop-uri'];
        testValidateSignedRequest(true);
    });

    test('Should throw when trying to validate with no fspiop-http-method header', () => {
        signer.sign(testOpts);
        delete testOpts.headers['fspiop-http-method'];
        testValidateSignedRequest(true);
    });

    test('Should throw when trying to validate with modified body', () => {
        signer.sign(testOpts);
        body.abc = 456;
        testValidateSignedRequest(true);
    });

    test('Should throw when trying to validate with modified body(data)', () => {
        signer.sign(testOptsData);
        body.abc = 456;
        testValidateSignedRequestData(true);
    });

    test('Should throw when trying to validate with missing fspiop-source header', () => {
        signer.sign(testOpts);
        delete testOpts.headers['fspiop-source'];
        testValidateSignedRequest(true);
    });

    test('Should throw when trying to validate with missing fspiop-uri header', () => {
        signer.sign(testOpts);
        delete testOpts.headers['fspiop-uri'];
        testValidateSignedRequest(true);
    });

    test('Should throw when trying to validate with missing fspiop-http-method header', () => {
        signer.sign(testOpts);
        delete testOpts.headers['fspiop-http-method'];
        testValidateSignedRequest(true);
    });

    test('Should throw when trying to validate with modified fspiop-destination header', () => {
        signer.sign(testOpts);
        testOpts.headers['fspiop-destination'] = 'fail';
        testValidateSignedRequest(true);
    });

    test('Should throw when trying to validate with modified date header', () => {
        signer.sign(testOpts);
        testOpts.headers.date = '1985-01-01T00:00:00.000Z';
        testValidateSignedRequest(true);
    });

    test('Should throw when trying to validate with modified fspiop-uri', () => {
        signer.sign(testOpts);
        testOpts.headers['fspiop-uri'] = '/parties/MSISDN/12345679';
        testValidateSignedRequest(true);
    });

    test('should throw when trying to validate without matching public key', () => {
        testOpts.headers['fspiop-source'] = 'unknownFsp';
        signer.sign(testOpts);
        testValidateSignedRequest(true);
    });


    // --- Constructor tests ---

    test('Should throw when creating signer without signing key', () => {
        expect(() => new Signer({ logger: mockLogger({ app: 'test' }, undefined) }))
            .toThrow('Signing key must be supplied as config argument');
    });

    test('Should throw when creating validator without validation keys', () => {
        expect(() => new Validator({ logger: mockLogger({ app: 'test' }, undefined) }))
            .toThrow('Validation keys must be supplied as config argument');
    });

    test('Should detect ES256 algorithm for EC private keys', () => {
        const crypto = require('node:crypto');
        const ecKeyPair = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
        const ecPrivateKey = ecKeyPair.privateKey.export({ type: 'sec1', format: 'pem' });
        const ecSigner = new Signer({
            signingKey: ecPrivateKey,
            logger: mockLogger({ app: 'ec-test' }, undefined)
        });
        expect(ecSigner.alg).toBe('ES256');
    });

    test('Should detect RS256 algorithm for RSA private keys', () => {
        expect(signer.alg).toBe('RS256');
    });


    // --- Sign and validate round-trip with various URI endpoints ---

    test.each([
        '/participants/MSISDN/123',
        '/parties/MSISDN/12345678',
        '/quotes/abc-123',
        '/transfers/def-456',
        '/bulkQuotes/ghi-789',
        '/bulkTransfers/jkl-012',
        '/transactionRequests/mno-345',
        '/fxQuotes/pqr-678',
        '/fxTransfers/stu-901',
    ])('Should sign and validate request with URI path %s', (path) => {
        testOpts.uri = `https://someswitch.com:443/prefix${path}`;
        signer.sign(testOpts);

        expect(testOpts.headers['fspiop-uri']).toBe(path);

        const validator = new Validator({
            validationKeys: { 'mojaloop-sdk': validationKey },
            logger: mockLogger({ app: 'validate-test' }, undefined)
        });
        expect(validator.validate({ headers: testOpts.headers, body })).toBe(true);
    });


    // --- ES256 end-to-end signing and validation ---

    test('Should sign and validate with ES256 keys', () => {
        const crypto = require('node:crypto');
        const ecKeyPair = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
        const ecPrivateKey = ecKeyPair.privateKey.export({ type: 'sec1', format: 'pem' });
        const ecPublicKey = ecKeyPair.publicKey.export({ type: 'spki', format: 'pem' });

        const ecSigner = new Signer({
            signingKey: ecPrivateKey,
            logger: mockLogger({ app: 'ec-test' }, undefined)
        });
        ecSigner.sign(testOpts);

        const ecValidator = new Validator({
            validationKeys: { 'mojaloop-sdk': ecPublicKey },
            logger: mockLogger({ app: 'ec-validate-test' }, undefined)
        });
        expect(ecValidator.validate({ headers: testOpts.headers, body })).toBe(true);
    });


    // --- Validation with wrong key should fail ---

    test('Should throw when validating with wrong public key (different key pair)', () => {
        const crypto = require('node:crypto');
        const wrongKeyPair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
        const wrongPublicKey = wrongKeyPair.publicKey.export({ type: 'spki', format: 'pem' });

        signer.sign(testOpts);

        const validator = new Validator({
            validationKeys: { 'mojaloop-sdk': wrongPublicKey },
            logger: mockLogger({ app: 'wrong-key-test' }, undefined)
        });
        expect(() => validator.validate({ headers: testOpts.headers, body })).toThrow();
    });


    // --- Protected header validation edge cases ---

    test('Should throw when validating with modified fspiop-source header', () => {
        signer.sign(testOpts);
        testOpts.headers['fspiop-source'] = 'mojaloop-sdk';
        // Change source to a value that still has a key but doesn't match protected header
        const validator = new Validator({
            validationKeys: {
                'mojaloop-sdk': validationKey,
                'tampered-source': validationKey
            },
            logger: mockLogger({ app: 'validate-test' }, undefined)
        });
        // Change source after signing - protected header still says 'mojaloop-sdk'
        testOpts.headers['fspiop-source'] = 'tampered-source';
        expect(() => validator.validate({ headers: testOpts.headers, body })).toThrow();
    });

    test('Should throw when fspiop-destination removed after signing', () => {
        signer.sign(testOpts);
        // Protected header has FSPIOP-Destination but HTTP header is removed
        delete testOpts.headers['fspiop-destination'];
        testValidateSignedRequest(true);
    });

    test('Should throw when date removed after signing', () => {
        signer.sign(testOpts);
        delete testOpts.headers['date'];
        testValidateSignedRequest(true);
    });

    test('Should validate successfully without optional headers', () => {
        delete testOpts.headers['fspiop-destination'];
        delete testOpts.headers['date'];
        signer.sign(testOpts);

        const validator = new Validator({
            validationKeys: { 'mojaloop-sdk': validationKey },
            logger: mockLogger({ app: 'validate-test' }, undefined)
        });
        expect(validator.validate({ headers: testOpts.headers, body })).toBe(true);
    });


    // --- Invalid fspiop-signature format ---

    test('Should throw when fspiop-signature is invalid JSON', () => {
        signer.sign(testOpts);
        testOpts.headers['fspiop-signature'] = 'not-valid-json';

        const validator = new Validator({
            validationKeys: { 'mojaloop-sdk': validationKey },
            logger: mockLogger({ app: 'validate-test' }, undefined)
        });
        expect(() => validator.validate({ headers: testOpts.headers, body })).toThrow();
    });


    // --- URI validation edge cases ---

    test('Should throw when signing with no URI path component', () => {
        testOpts.uri = '';
        expect(() => signer.sign(testOpts)).toThrow('URI not valid for protected header');
    });

    test('Should handle method case normalization', () => {
        testOpts.method = 'put';
        signer.sign(testOpts);
        expect(testOpts.headers['fspiop-http-method']).toBe('PUT');
        testValidateSignedRequest(false);
    });


    // --- Signature format validation ---

    test('getSignature should return valid JSON with signature and protectedHeader fields', () => {
        testOpts.headers['fspiop-uri'] = '/parties/MSISDN/12345678';
        testOpts.headers['fspiop-http-method'] = 'PUT';
        const signatureStr = signer.getSignature(testOpts);
        const parsed = JSON.parse(signatureStr);

        expect(parsed).toHaveProperty('signature');
        expect(parsed).toHaveProperty('protectedHeader');
        expect(typeof parsed.signature).toBe('string');
        expect(typeof parsed.protectedHeader).toBe('string');
        expect(parsed.signature.length).toBeGreaterThan(0);
        expect(parsed.protectedHeader.length).toBeGreaterThan(0);
    });

    test('Protected header should decode to valid JSON with required fields', () => {
        const base64url = require('base64url');
        testOpts.headers['fspiop-uri'] = '/parties/MSISDN/12345678';
        testOpts.headers['fspiop-http-method'] = 'PUT';
        const signatureStr = signer.getSignature(testOpts);
        const parsed = JSON.parse(signatureStr);
        const decoded = JSON.parse(base64url.decode(parsed.protectedHeader));

        expect(decoded.alg).toBe('RS256');
        expect(decoded['FSPIOP-URI']).toBe('/parties/MSISDN/12345678');
        expect(decoded['FSPIOP-HTTP-Method']).toBe('PUT');
        expect(decoded['FSPIOP-Source']).toBe('mojaloop-sdk');
        expect(decoded['FSPIOP-Destination']).toBe('some-other-fsp');
        expect(decoded['Date']).toBeTruthy();
    });


    // --- Multiple validation keys ---

    test('Should validate with multiple keys configured for different sources', () => {
        signer.sign(testOpts);

        const crypto = require('node:crypto');
        const otherKeyPair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
        const otherPublicKey = otherKeyPair.publicKey.export({ type: 'spki', format: 'pem' });

        const validator = new Validator({
            validationKeys: {
                'mojaloop-sdk': validationKey,
                'other-fsp': otherPublicKey,
            },
            logger: mockLogger({ app: 'multi-key-test' }, undefined)
        });
        expect(validator.validate({ headers: testOpts.headers, body })).toBe(true);
    });
});

// --- Post-Quantum Cryptography (ML-DSA) tests ---

const PQC_ALGORITHMS = ['ml-dsa-44', 'ml-dsa-65', 'ml-dsa-87'];
const PQC_JWS_ALGS   = ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'];

describe('JWS PQC (ML-DSA)', () => {
    const conditionalTest = hasMlDsaSupport ? test : test.skip;

    // Helper: build a minimal signed PQC request
    function makePqcSignedRequest ({ alg, cryptoAlg, uri = true }) {
        const { publicKey, privateKey } = crypto.generateKeyPairSync(cryptoAlg);
        const pqSigner = new Signer({
            signingKey: privateKey,
            logger: mockLogger({ app: `pqc-${alg}` }, undefined),
            alg
        });
        const pqValidator = new Validator({
            validationKeys: { 'mojaloop-sdk': publicKey },
            logger: mockLogger({ app: `pqc-validate-${alg}` }, undefined)
        });
        const pqBody = { amount: '100', currency: 'USD' };
        const opts = {
            headers: {
                'fspiop-source': 'mojaloop-sdk',
                'fspiop-destination': 'dest-fsp',
                date: new Date().toISOString()
            },
            method: 'POST',
            ...(uri
                ? { uri: 'https://switch.example:443/prefix/transfers/abc-123', body: pqBody }
                : { url: 'https://switch.example:443/prefix/transfers/abc-123', data: pqBody }
            )
        };
        pqSigner.sign(opts);
        return { pqValidator, opts, pqBody };
    }

    // Round-trip sign + validate for all three ML-DSA parameter sets
    test.each(PQC_ALGORITHMS.map((a, i) => [a, PQC_JWS_ALGS[i]]))('Should sign and validate with %s (uri/body style)', (cryptoAlg, jwsAlg) => {
        if (!hasMlDsaSupport) return;
        const { pqValidator, opts, pqBody } = makePqcSignedRequest({ alg: jwsAlg, cryptoAlg });

        expect(opts.headers['fspiop-signature']).toBeTruthy();
        expect(opts.headers['fspiop-uri']).toBe('/transfers/abc-123');
        expect(opts.headers['fspiop-http-method']).toBe('POST');
        expect(pqValidator.validate({ headers: opts.headers, body: pqBody })).toBe(true);
    });

    // Axios-style (url/data) signing for ML-DSA-44
    conditionalTest('Should sign and validate with ML-DSA-44 (url/data axios style)', () => {
        const { pqValidator, opts, pqBody } = makePqcSignedRequest({
            alg: 'ML-DSA-44', cryptoAlg: 'ml-dsa-44', uri: false
        });

        expect(opts.headers['fspiop-signature']).toBeTruthy();
        expect(pqValidator.validate({ headers: opts.headers, data: pqBody })).toBe(true);
    });

    // getSignature returns correct JSON structure for PQC
    conditionalTest('getSignature should return JSON with signature and protectedHeader for ML-DSA-44', () => {
        const base64url = require('base64url');
        const { publicKey, privateKey } = crypto.generateKeyPairSync('ml-dsa-44');
        void publicKey;
        const pqSigner = new Signer({
            signingKey: privateKey,
            logger: mockLogger({ app: 'pqc-sig-struct' }, undefined),
            alg: 'ML-DSA-44'
        });
        const opts = {
            headers: {
                'fspiop-source': 'mojaloop-sdk',
                'fspiop-destination': 'dest-fsp',
                'fspiop-uri': '/transfers/abc-123',
                'fspiop-http-method': 'POST',
                date: new Date().toISOString()
            },
            method: 'POST',
            uri: 'https://switch.example:443/prefix/transfers/abc-123',
            body: { amount: '100' }
        };
        const sigStr = pqSigner.getSignature(opts);
        const parsed = JSON.parse(sigStr);

        expect(parsed).toHaveProperty('signature');
        expect(parsed).toHaveProperty('protectedHeader');
        expect(typeof parsed.signature).toBe('string');
        expect(typeof parsed.protectedHeader).toBe('string');

        const decoded = JSON.parse(base64url.decode(parsed.protectedHeader));
        expect(decoded.alg).toBe('ML-DSA-44');
        expect(decoded['FSPIOP-URI']).toBe('/transfers/abc-123');
        expect(decoded['FSPIOP-HTTP-Method']).toBe('POST');
        expect(decoded['FSPIOP-Source']).toBe('mojaloop-sdk');
    });

    // Tampered body should fail validation
    conditionalTest('Should throw when body is tampered after PQC signing', () => {
        const { pqValidator, opts } = makePqcSignedRequest({ alg: 'ML-DSA-44', cryptoAlg: 'ml-dsa-44' });
        const tamperedBody = { amount: '999', currency: 'USD' };

        expect(() => pqValidator.validate({ headers: opts.headers, body: tamperedBody })).toThrow();
    });

    // Tampered signature bytes should fail validation
    conditionalTest('Should throw when PQC signature bytes are tampered', () => {
        const base64url = require('base64url');
        const { pqValidator, opts, pqBody } = makePqcSignedRequest({ alg: 'ML-DSA-44', cryptoAlg: 'ml-dsa-44' });

        const sigObj = JSON.parse(opts.headers['fspiop-signature']);
        const sigBytes = base64url.toBuffer(sigObj.signature);
        sigBytes[0] ^= 0xff; // flip bits in first byte
        sigObj.signature = base64url(sigBytes);
        opts.headers['fspiop-signature'] = JSON.stringify(sigObj);

        expect(() => pqValidator.validate({ headers: opts.headers, body: pqBody })).toThrow();
    });

    // Wrong public key should fail validation
    conditionalTest('Should throw when validating PQC signature with wrong public key', () => {
        const { opts, pqBody } = makePqcSignedRequest({ alg: 'ML-DSA-44', cryptoAlg: 'ml-dsa-44' });
        const { publicKey: wrongPublicKey } = crypto.generateKeyPairSync('ml-dsa-44');

        const wrongValidator = new Validator({
            validationKeys: { 'mojaloop-sdk': wrongPublicKey },
            logger: mockLogger({ app: 'pqc-wrong-key' }, undefined)
        });
        expect(() => wrongValidator.validate({ headers: opts.headers, body: pqBody })).toThrow();
    });

    // Node version guard in JwsSigner constructor
    test('Should throw when creating PQC signer on unsupported Node.js version', () => {
        const originalVersion = process.versions.node;
        Object.defineProperty(process.versions, 'node', { value: '22.0.0', configurable: true });
        try {
            expect(() => new Signer({
                signingKey: 'dummy-key',
                logger: mockLogger({ app: 'pqc-version-test' }, undefined),
                alg: 'ML-DSA-65'
            })).toThrow('requires Node.js >= 24.7.0');
        } finally {
            Object.defineProperty(process.versions, 'node', { value: originalVersion, configurable: true });
        }
    });

    // Mismatched fspiop-destination after PQC signing should fail
    conditionalTest('Should throw when fspiop-destination is modified after PQC signing', () => {
        const { pqValidator, opts, pqBody } = makePqcSignedRequest({ alg: 'ML-DSA-44', cryptoAlg: 'ml-dsa-44' });
        opts.headers['fspiop-destination'] = 'tampered-fsp';

        expect(() => pqValidator.validate({ headers: opts.headers, body: pqBody })).toThrow();
    });

    // Date header modification after PQC signing should fail
    conditionalTest('Should throw when date header is modified after PQC signing', () => {
        const { pqValidator, opts, pqBody } = makePqcSignedRequest({ alg: 'ML-DSA-44', cryptoAlg: 'ml-dsa-44' });
        opts.headers.date = '1985-01-01T00:00:00.000Z';

        expect(() => pqValidator.validate({ headers: opts.headers, body: pqBody })).toThrow();
    });
});

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
const JwsTest = require('../../src/lib/jws');
const Signer = JwsTest.signer;
const Validator = JwsTest.validator;
const mockLogger = require('../__mocks__/mockLogger');

const signingKey = fs.readFileSync(__dirname + '/data/jwsSigningKey.pem');
const validationKey = fs.readFileSync(__dirname + '/data/jwsValidationKey.pem');

describe('JWS', () => {
    let signer;
    let testOpts;
    let testOptsData;
    let body;

    beforeEach(() => {
        signer = new Signer({
            signingKey: signingKey,
            logger: mockLogger({ app: 'jws-test' }, undefined)
        });
        body = { test: 123 };
        // An request-promise-native style request uses the `.uri` and `.body` properties instead of the `.url` and `.data` properties.
        testOpts = {
            headers: {
                'fspiop-source': 'mojaloop-sdk',
                'fspiop-destination': 'some-other-fsp',
                'date': new Date().toISOString(),
            },
            method: 'PUT',
            uri: 'https://someswitch.com:443/prefix/parties/MSISDN/12345678',
            body,
        };
        // An axios-style request uses the `.url` and `.data` properties instead of the `.uri` and `.body` properties.
        testOptsData = {
            headers: {
                'fspiop-source': 'mojaloop-sdk',
                'fspiop-destination': 'some-other-fsp',
                'date': new Date().toISOString(),
            },
            method: 'PUT',
            url: 'https://someswitch.com:443/prefix/parties/MSISDN/12345678',
            data: body,
        };
    });

    function testValidateSignedRequest(shouldFail) {
        const request = {
            headers: testOpts.headers,
            body: body,
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

    function testValidateSignedRequestData(shouldFail) {
        const request = {
            headers: testOptsData.headers,
            data: body,
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
        testOpts.headers['date'] = '1985-01-01T00:00:00.000Z';
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
});

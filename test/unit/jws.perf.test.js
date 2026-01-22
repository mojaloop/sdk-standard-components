'use strict';

const fs = require('fs');
const JwsTest = require('../../src/lib/jws');
const Signer = JwsTest.signer;
const Validator = JwsTest.validator;
const mockLogger = require('../__mocks__/mockLogger');
const crypto = require('node:crypto');

const signingKey = fs.readFileSync(__dirname + '/data/jwsSigningKey.pem');
const validationKey = fs.readFileSync(__dirname + '/data/jwsValidationKey.pem');
const key = {
    kty: 'EC',
    d: 'iYjERsNErBjCQljkeU8EJVAwU-dMxi_07vdYgTPRsx4',
    use: 'sig',
    crv: 'P-256',
    x: 'ok3_fYYnzhXij__aLGXKr0AKGjjUo1tAqt9z4jp3iog',
    y: '_AlRjdUsqPTbpRExkd5vNcsqCSKSDx31mBuMewZTcds',
    alg: 'ES256'
};

const signingKeyEC = crypto.createPrivateKey({ format: 'jwk', key }).export({ format: 'pem', type: 'sec1' });
const validationKeyEC = crypto.createPublicKey({ format: 'jwk', key }).export({ format: 'pem', type: 'spki' });

describe('JWS', () => {
    let signer;
    let signerEC;
    let testOpts;
    // let testOptsData;
    let body;

    beforeEach(() => {
        signer = new Signer({
            signingKey,
            logger: mockLogger({ app: 'jws-test' }, undefined)
        });
        signerEC = new Signer({
            signingKey: signingKeyEC,
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
    });

    function testValidateSignedRequest (shouldFail, key) {
        const request = {
            headers: testOpts.headers,
            body
        };

        const validate = () => {
            const validator = new Validator({
                validationKeys: {
                    'mojaloop-sdk': key
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
        for (let i = 1; i < 1000; i++) signer.sign(testOpts);

        expect(testOpts.headers['fspiop-signature']).toBeTruthy();
        expect(testOpts.headers['fspiop-uri']).toBe('/parties/MSISDN/12345678');
        expect(testOpts.headers['fspiop-http-method']).toBe('PUT');

        testValidateSignedRequest(false, validationKey);
    });

    test('Should generate valid JWS headers and signature for request with body ES256', () => {
        for (let i = 1; i < 1000; i++) signerEC.sign(testOpts, 'ES256');

        expect(testOpts.headers['fspiop-signature']).toBeTruthy();
        expect(testOpts.headers['fspiop-uri']).toBe('/parties/MSISDN/12345678');
        expect(testOpts.headers['fspiop-http-method']).toBe('PUT');

        testValidateSignedRequest(false, validationKeyEC);
    });
});

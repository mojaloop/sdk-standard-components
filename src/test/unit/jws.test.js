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

const JwsTest = require('../../lib/jws');
const Signer = JwsTest.signer;
const Validator = JwsTest.validator;

const signingKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0eJEh3Op5p6x137lRkAsvmEBbd32dbRChrCUItZbtxjf/qfB
yD5k8Hn4n4vbqzP8XSGS0f6KmNC+iRaP74HVgzAqc4Uid4J8dtSBq3VmucYQYzLc
101QjuvD+SKmZwlw/q0PtulmqlASI2SbMfwcAraMi6ab7v5W4EGNeIPLEIo3BXsQ
DTCWqiZb7aXkHkcY7sOjAzK/2bNGYFmAthdYrHzvCkqnJ7LAHX3Oj7rJea5MqtuN
B9POZYaD10n9JuYWdwPqLrw6/hVgPSFEy+ulrVbXf54ZH0dfMThAYRvFrT81yulk
H95JhXWGdi6cTp6t8LVOKFhnNfxjWw0Jayj9xwIDAQABAoIBADB2u/Y/CgNbr5sg
DRccqHhJdAgHkep59kadrYch0knEL6zg1clERxCUSYmlxNKSjXp/zyQ4T46b3PNQ
x2m5pDDHxXWpT10jP1Q9G7gYwuCw0IXnb8EzdB+cZ0M28g+myXW1RoSo/nDjTlzn
1UJEgb9Kocd5cFZOWocr+9vRKumlZULMsA8yiNwlAfJHcMBM7acsa3myCqVhLyWt
4BQylVuLFa+A6QzpMXEwFCq8EOXf07gl1XVzC6LJ1fTa9gVM3N+YE+oEXKrsHCxG
/ACgKsjepL27QjJ7qvecWPP0F2LxEZYOm5tbXaKJTobzQUJHgUokanZMhjYprDsZ
zumLw9kCgYEA/DUWcnLeImlfq/EYdhejkl3J+WX3vhS23OqVgY1amu7CZzaai6vt
H0TRc8Zsbi4jgmFDU8PFzytP6qz6Tgom4R736z6oBi7bjnGyN17/NSbf+DaRVcM6
vnZr7jNC2FJlECmIN+dkwUA/YCr2SA7hxZXM9mIYSc+6+glDiIO5Cf0CgYEA1Qo/
uQbVHhW+Cp8H0kdMuhwUbkBquRrxRZlXS1Vrf3f9me9JLUy9UPWb3y3sKVurG5+O
SIlr4hDcZyXdE198MtDMhBIGqU9ORSjppJDNDVvtt+n2FD4XmWIU70vKBJBivX0+
Bow6yduis+p12fuvpvpnKCz8UjOgOQJhLZ4GQBMCgYBP6gpozVjxkm4ML2LO2IKt
+CXtbo/nnOysZ3BkEoQpH4pd5gFmTF3gUJAFnVPyPZBm2abZvejJ0jGKbLELVVAo
eQWZdssK2oIbSo9r2CAJmX3SSogWorvUafWdDoUZwlHfoylUfW+BhHgQYsyS3JRR
ZTwCveZwTPA0FgdeFE7niQKBgQCHaD8+ZFhbCejDqXb4MXdUJ3rY5Lqwsq491YwF
huKPn32iNNQnJcqCxclv3iln1Cr6oLx34Fig1KSyLv/IS32OcuY635Y6UPznumxe
u+aJIjADIILXNOwdAplZy6s4oWkRFaSx1rmbCa3tew2zImTv1eJxR76MpOGmupt3
uiQw3wKBgFjBT/aVKdBeHeP1rIHHldQV5QQxZNkc6D3qn/oAFcwpj9vcGfRjQWjO
ARzXM2vUWEet4OVn3DXyOdaWFR1ppehz7rAWBiPgsMg4fjAusYb9Mft1GMxMzuwT
Oyqsp6pzAWFrCD3JAoTLxClV+j5m+SXZ/ItD6ziGpl/h7DyayrFZ
-----END RSA PRIVATE KEY-----`;

const validationKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0eJEh3Op5p6x137lRkAs
vmEBbd32dbRChrCUItZbtxjf/qfByD5k8Hn4n4vbqzP8XSGS0f6KmNC+iRaP74HV
gzAqc4Uid4J8dtSBq3VmucYQYzLc101QjuvD+SKmZwlw/q0PtulmqlASI2SbMfwc
AraMi6ab7v5W4EGNeIPLEIo3BXsQDTCWqiZb7aXkHkcY7sOjAzK/2bNGYFmAthdY
rHzvCkqnJ7LAHX3Oj7rJea5MqtuNB9POZYaD10n9JuYWdwPqLrw6/hVgPSFEy+ul
rVbXf54ZH0dfMThAYRvFrT81yulkH95JhXWGdi6cTp6t8LVOKFhnNfxjWw0Jayj9
xwIDAQAB
-----END PUBLIC KEY-----`;

describe('JWS', () => {
    let signer;
    let testOpts;
    let body;

    beforeEach(() => {
        signer = new Signer({
            signingKey: signingKey
        });
        body = { test: 123 };
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
                }
            });
            validator.validate(request);
        };

        if (shouldFail) {
            expect(validate).toThrow();
        } else {
            validate();
        }
    }


    test('Should generate valid JWS headers and signature', () => {
        signer.sign(testOpts);

        expect(testOpts.headers['fspiop-signature']).toBeTruthy();
        expect(testOpts.headers['fspiop-uri']).toBe('/parties/MSISDN/12345678');
        expect(testOpts.headers['fspiop-http-method']).toBe('PUT');

        testValidateSignedRequest(false);
    });


    test('Should throw when trying to sign with no body', () => {
        delete testOpts.body;

        expect(() => {
            signer.sign(testOpts);
        }).toThrow();
    });


    test('Should throw when trying to validate with no body', () => {
        signer.sign(testOpts);
        delete testOpts.body;
        body = undefined;
        testValidateSignedRequest(true);
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

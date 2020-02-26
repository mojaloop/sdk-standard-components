/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - james.bush@modusbox.com                             *
 **************************************************************************/

jest.mock('request-promise-native');
const request = require('request-promise-native');
const requestActual = jest.requireActual('request-promise-native');

const mr = require('../../../../lib/mojaloop-requests/mojaloopRequests.js');
const WSO2Auth = require('../../../../lib/WSO2Auth');


const jwsSigningKey = `-----BEGIN RSA PRIVATE KEY-----
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


describe('PUT /parties', () => {

    async function testPutParties(jwsSign, jwsSignPutParties, expectUndefined) {
        const wso2Auth = new WSO2Auth({logger: console});

        // Everything is false by default
        const conf = {
            logger: console,
            tls: {
                outbound: {
                    mutualTLS: {
                        enabled: false
                    }
                }
            },
            jwsSign: jwsSign,
            jwsSignPutParties: jwsSignPutParties,
            jwsSigningKey: jwsSigningKey,
            wso2Auth,
        };

        const requestSpy = request.mockImplementation(async () => ({
            statusCode: 200,
            headers: {
                'content-length': 0
            },
        }));

        const testMr = new mr(conf);
        await testMr.putParties('MSISDN', '123456', {fspid: 'dummy'}, 'dummy');


        if (expectUndefined) {
            expect(requestSpy.mock.calls[0][0].headers['fspiop-signature']).toBeUndefined();
        } else {
            expect(requestSpy.mock.calls[0][0].headers['fspiop-signature']).toBeTruthy();
        }

        requestSpy.mockClear();
    }

    test(
        'signs put parties when jwsSign and jwsSignPutParties are true',
        async () => {
            await testPutParties(true, true, false);
        }
    );


    test(
        'does not sign put parties when jwsSign is true and jwsSignPutParties is false',
        async () => {
            await testPutParties(true, false, true);
        }
    );


    test(
        'does not sign put parties when jwsSign and jwsSignPutParties are false',
        async () => {
            await testPutParties(false, false, true);
        }
    );


    test(
        'does not sign put parties when jwsSign is false and jwsSignPutParties is true',
        async () => {
            await testPutParties(false, true, true);
        }
    );
});

describe('PUT /quotes', () => {

    async function testPutQuotes(jwsSign, jwsSignPutParties, expectUndefined) {
        const wso2Auth = new WSO2Auth({logger: console});

        // Everything is false by default
        const conf = {
            logger: console,
            tls: {
                outbound: {
                    mutualTLS: {
                        enabled: false
                    }
                },
            },
            jwsSign: jwsSign,
            jwsSignPutParties: jwsSignPutParties,
            jwsSigningKey: jwsSigningKey,
            wso2Auth,
        };

        const requestSpy = request.mockImplementation(async () => ({
            statusCode: 200,
            headers: {
                'content-length': 0
            },
        }));

        const testMr = new mr(conf);
        await testMr.putQuotes('fake-quote', {quoteId: 'dummy'}, 'dummy');

        if (expectUndefined) {
            expect(requestSpy.mock.calls[0][0].headers['fspiop-signature']).toBeUndefined();
        } else {
            expect(requestSpy.mock.calls[0][0].headers['fspiop-signature']).toBeTruthy();
        }

        requestSpy.mockClear();
    }


    test(
        'signs put quotes when jwsSign is true and jwsSignPutParties is false',
        async () => {
            await testPutQuotes(true, false, false);
        }
    );


    test(
        'does not sign put quotes when jwsSign is false and jwsSignPutParties is true',
        async () => {
            await testPutQuotes(false, true, true);
        }
    );


    test(
        'does not sign put quotes when jwsSign is false and jwsSignPutParties is false',
        async () => {
            await testPutQuotes(false, false, true);
        }
    );


    test(
        'signs put parties when jwsSign is true and jwsSignPutParties is not supplied',
        async () => {
            await testPutQuotes(true, undefined, false);
        }
    );


    test(
        'does not sign put parties when jwsSign is false and jwsSignPutParties is not supplied',
        async () => {
            await testPutQuotes(false, undefined, true);
        }
    );
});

describe('request serialization', () => {

    async function primRequestSerializationTest(mojaloopRequestMethodName) {
        let jwsSign = false;
        let jwsSignPutParties = false;

        const requestSpy = request.mockImplementation(async (...args) => requestActual(...args));

        const wso2Auth = new WSO2Auth({logger: console});

        // Everything is false by default
        const conf = {
            logger: console,
            tls: {
                outbound: {
                    mutualTLS: {
                        enabled: false
                    }
                },
            },
            jwsSign: jwsSign,
            jwsSignPutParties: jwsSignPutParties,
            jwsSigningKey: jwsSigningKey,
            peerEndpoint: '127.0.0.1:9999',
            wso2Auth,
        };

        const testMr = new mr(conf);
        let url = '/';
        let resourceType = 'parties';
        let body = {a: 1};
        let dest = '42';
        let mojaloopRequestMethod = testMr[mojaloopRequestMethodName].bind(testMr);
        await mojaloopRequestMethod(url, resourceType, body, dest);
        requestSpy.mockClear();
    }

    test(
        'does not throw "TypeError [ERR_INVALID_ARG_TYPE]: The first argument must be one of type string or Buffer. Received type object when sending an Object" on _post',
        async () => {
            expect.hasAssertions();
            try {
                await primRequestSerializationTest('_post');
            } catch (err) {
                expect(err.cause.code).toBe('ECONNREFUSED');
                expect(err.cause.address).toBe('127.0.0.1');
                expect(err.cause.port).toBe(9999);
            }
        }
    );

    test(
        'does not throw "TypeError [ERR_INVALID_ARG_TYPE]: The first argument must be one of type string or Buffer. Received type object when sending an Object" on _put',
        async () => {
            expect.hasAssertions();
            try {
                await primRequestSerializationTest('_put');
            } catch (err) {
                expect(err.cause.code).toBe('ECONNREFUSED');
                expect(err.cause.address).toBe('127.0.0.1');
                expect(err.cause.port).toBe(9999);
            }
        }
    );
});

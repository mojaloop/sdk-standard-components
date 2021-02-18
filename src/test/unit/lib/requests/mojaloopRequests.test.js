/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - james.bush@modusbox.com                             *
 **************************************************************************/

const fs = require('fs');
jest.mock('http');
const http = require('http');

const mr = require('../../../../lib/requests/mojaloopRequests.js');
const WSO2Auth = require('../../../../lib/WSO2Auth');
const mockLogger = require('../../../__mocks__/mockLogger');

const jwsSigningKey = fs.readFileSync(__dirname + '/../../data/jwsSigningKey.pem');

describe('PUT /parties', () => {

    async function testPutParties (jwsSign, jwsSignPutParties, expectUndefined) {
        const wso2Auth = new WSO2Auth({ logger: console });

        // Everything is false by default
        const conf = {
            logger: mockLogger({ app: 'put-parties-test' }),
            peerEndpoint: '127.0.0.1',
            tls: {
                mutualTLS: {
                    enabled: false
                }
            },
            jwsSign: jwsSign,
            jwsSignPutParties: jwsSignPutParties,
            jwsSigningKey: jwsSigningKey,
            wso2Auth,
        };

        http.__request = jest.fn(() => ({
            statusCode: 200,
            headers: {
                'content-length': 0
            },
        }));

        const testMr = new mr(conf);
        await testMr.putParties('MSISDN', '123456', '', 'dummy');


        if (expectUndefined) {
            expect(http.__request.mock.calls[0][0].headers['fspiop-signature']).toBeUndefined();
        } else {
            expect(http.__request.mock.calls[0][0].headers['fspiop-signature']).toBeTruthy();
        }

        http.__request.mockClear();
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

    async function testPutQuotes (jwsSign, jwsSignPutParties, expectUndefined) {
        const wso2Auth = new WSO2Auth({ logger: console });

        // Everything is false by default
        const conf = {
            // Disable logging in tests
            logger: mockLogger({ app: 'put-quotes-test' }),
            tls: {
                mutualTLS: {
                    enabled: false
                }
            },
            jwsSign: jwsSign,
            jwsSignPutParties: jwsSignPutParties,
            jwsSigningKey: jwsSigningKey,
            wso2Auth,
        };

        http.__request = jest.fn(() => ({
            statusCode: 200,
            headers: {
                'content-length': 0
            },
        }));

        const testMr = new mr(conf);
        await testMr.putQuotes('fake-quote', { quoteId: 'dummy' }, 'dummy');

        if (expectUndefined) {
            expect(http.__request.mock.calls[0][0].headers['fspiop-signature']).toBeUndefined();
        } else {
            expect(http.__request.mock.calls[0][0].headers['fspiop-signature']).toBeTruthy();
        }

        http.__request.mockClear();
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

describe('postAuthorizations', () => {
    const wso2Auth = new WSO2Auth({ logger: mockLogger({ app: 'post-authorizations-test' }) });
    const conf = {
        logger: mockLogger({ app: 'postAuthorizations-test' }),
        peerEndpoint: '127.0.0.1',
        tls: {
            mutualTLS: {
                enabled: false
            }
        },
        jwsSign: false,
        jwsSignPutParties: false,
        jwsSigningKey: jwsSigningKey,
        wso2Auth,
    };

    it('executes a `POST /authorizations` request', async () => {
        // Arrange
        http.__request = jest.fn(() => ({
            statusCode: 202,
            headers: {
                'content-length': 0
            },
        }));
        const testMR = new mr(conf);
        const authorizationRequest = {
            transactionRequestId: '123',
            authenticationType: 'U2F',
            retriesLeft: '1',
            amount: {
                amount: '100',
                currency: 'U2F',
            },
            transactionId: '987'
        };

        // Act
        await testMR.postAuthorizations(authorizationRequest, 'pispa');

        // Assert
        expect(http.__write.mock.calls[0][0]).toStrictEqual(JSON.stringify(authorizationRequest));
        expect(http.__request.mock.calls[0][0].headers['fspiop-destination']).toBe('pispa');
        expect(http.__request.mock.calls[0][0].path).toBe('/authorizations');
    });
});
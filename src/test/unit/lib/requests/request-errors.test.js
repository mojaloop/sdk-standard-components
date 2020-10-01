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

const mr = require('../../../../lib/requests/mojaloopRequests.js');
const WSO2Auth = require('../../../../lib/WSO2Auth');
const mockLogger = require('../../../__mocks__/mockLogger');

const jwsSigningKey = fs.readFileSync(__dirname + '/../../data/jwsSigningKey.pem');

describe('request serialization', () => {

    async function primRequestSerializationTest(mojaloopRequestMethodName) {
        let jwsSign = false;
        let jwsSignPutParties = false;

        const wso2Auth = new WSO2Auth({logger: console});

        // Everything is false by default
        const conf = {
            logger: mockLogger({ app: 'request-errors-test' }),
            tls: {
                mutualTLS: {
                    enabled: false
                }
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
    }

    test(
        'does not throw "TypeError [ERR_INVALID_ARG_TYPE]: The first argument must be one of type string or Buffer. Received type object when sending an Object" on _post',
        async () => {
            expect.hasAssertions();
            try {
                await primRequestSerializationTest('_post');
            } catch (err) {
                expect(err.code).toBe('ECONNREFUSED');
                expect(err.address).toBe('127.0.0.1');
                expect(err.port).toBe(9999);
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
                expect(err.code).toBe('ECONNREFUSED');
                expect(err.address).toBe('127.0.0.1');
                expect(err.port).toBe(9999);
            }
        }
    );
});

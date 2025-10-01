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

const fs = require('node:fs');

const mr = require('../../../../src/lib/requests/mojaloopRequests.js');
const OIDCAuth = require('../../../../src/lib/OIDCAuth');
const { defaultHttpConfig, createHttpRequester } = require('#src/lib/httpRequester/index');
const mockLogger = require('../../../__mocks__/mockLogger');

const jwsSigningKey = fs.readFileSync(__dirname + '/../../data/jwsSigningKey.pem');
const logger = mockLogger({ app: 'request-errors-test' });

describe('request error handling', () => {

    async function primRequestSerializationTest(mojaloopRequestMethodName) {
        let jwsSign = false;
        let jwsSignPutParties = false;

        const oidc = new OIDCAuth({ logger });

        // Everything is false by default
        const conf = {
            logger,
            tls: {
                mutualTLS: {
                    enabled: false
                }
            },
            jwsSign: jwsSign,
            jwsSignPutParties: jwsSignPutParties,
            jwsSigningKey: jwsSigningKey,
            peerEndpoint: '127.0.0.1:9999',
            oidc,
        };

        const testMr = new mr(conf);
        let url = '/test';
        let resourceType = 'parties';
        let body = { a: 1 };
        let dest = '42';
        let mojaloopRequestMethod = testMr[mojaloopRequestMethodName].bind(testMr);
        await mojaloopRequestMethod(url, resourceType, body, dest);
        await oidc.stop();
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

    test('Errors include original request object', async () => {
        expect.hasAssertions();
        try {
            await primRequestSerializationTest('_post');
        } catch (err) {
            expect(err.code).toBe('ECONNREFUSED');
            expect(err.address).toBe('127.0.0.1');
            expect(err.port).toBe(9999);

            expect(err.originalRequest).toBeDefined();
            expect(err.originalRequest.data).toBeDefined();
            expect(err.originalRequest.headers).toBeDefined();
            expect(err.originalRequest.baseURL).toBeDefined();
            expect(err.originalRequest.url).toBeDefined();
            expect(err.originalRequest.method).toBeDefined();
        }
    });

    describe('axios Timeout Test -->', () => {
        test('should be able to set default timeout', async () => {
            expect.hasAssertions();
            const timeout = 1;
            const httpConfig = { ...defaultHttpConfig, timeout };
            const http = createHttpRequester({ httpConfig });
            const uri = 'https://jsonplaceholder.typicode.com/todos';

            await http.sendRequest({ uri })
                .catch(err => {
                    expect(err.message).toBe(`timeout of ${timeout}ms exceeded`);
                    expect(err.code).toBe('ECONNABORTED');
                });
        });
    });
});

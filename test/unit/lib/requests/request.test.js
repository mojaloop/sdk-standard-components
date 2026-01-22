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
 - Yevhen Kyriukha - yevhen.kyriukha@modusbox.com - ORIGINAL AUTHOR

 --------------
 ******/

const { mockAxios } = require('#test/unit/utils');

const { Readable } = require('node:stream');
const crypto = require('node:crypto');
const querystring = require('querystring');

const mr = require('../../../../src/lib/requests/mojaloopRequests.js');
const OIDCAuth = require('../../../../src/lib/OIDCAuth');
const mockLogger = require('../../../__mocks__/mockLogger');
const { mockConfigDto } = require('../../../fixtures');

const logger = mockLogger({ app: 'request-test' });

describe('mojaloopRequests Tests', () => {
    beforeEach(() => {
        mockAxios.reset();
    });

    function streamToBuffer (stream) {
        const chunks = [];
        return new Promise((resolve, reject) => {
            stream.on('data', chunk => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }

    const toStream = data => Readable.from(data instanceof Buffer
        ? data
        : Buffer.from(JSON.stringify(data))
    );

    const parseStreamData = async (data, expectedResponse, responseType) => {
        if (!responseType.stream) return data;

        let parsed = await streamToBuffer(data);
        if (typeof expectedResponse.data === 'object' && responseType.json) {
            parsed = JSON.parse(parsed);
        }
        return parsed;
    };

    const executeRequest = async (request, expectedResponse, responseType) => {
        const qs = querystring.encode(request.query);
        mockAxios
            .onPost(request.uri + (qs ? `?${qs}` : ''), request.body)
            .reply(
                expectedResponse.statusCode,
                responseType.stream ? toStream(expectedResponse.data) : expectedResponse.data,
                expectedResponse.headers
            );

        const oidc = new OIDCAuth({ logger });

        const conf = mockConfigDto({
            logger,
            oidc,
            peerEndpoint: request.host,
            jwsSign: true,
            jwsSignPutParties: true
        });
        const testMr = new mr(conf);
        const resp = await testMr.postCustom(request.uri, request.body, request.headers, request.query, responseType.stream)
            .catch(err => err);

        await oidc.stop();

        return resp;
    };

    async function testRequest (request, expectedResponse, responseType) {
        const resp = await executeRequest(request, expectedResponse, responseType);

        expect(resp.originalRequest.data).toEqual(request.body);
        expect(resp.originalRequest.headers).toBeDefined();
        expect(resp.originalRequest.url).toBeDefined();

        if (!expectedResponse.originalRequest) {
            // ignore the originalRequest prop on resp.
            delete resp.originalRequest;
        }
        const data = await parseStreamData(resp.data, expectedResponse, responseType);

        expect({ ...resp, data }).toEqual(expectedResponse);
    }

    test('should send correct request and receive correct JSON response', async () => {
        const expectedResponse = {
            data: { id: '123ABC' },
            statusCode: 200,
            headers: {
                'content-type': 'application/json',
                'x-other-header': 'other-content'
            }
        };
        const request = {
            protocol: 'http',
            host: 'www.example.com',
            uri: '/login',
            body: 'some body',
            query: {
                a: 123,
                b: 'other param'
            }
        };
        await testRequest(request, expectedResponse, { json: true });
    });

    test('should send correct request and receive stream response', async () => {
        const expectedResponse = {
            data: { id: '123ABC' },
            statusCode: 200,
            headers: {
                'content-type': 'application/json',
                'x-other-header': 'other-content'
            }
        };
        const request = {
            protocol: 'http',
            host: 'www.example.com',
            uri: '/login',
            body: 'some body',
            query: {
                a: 123,
                b: 'other param'
            }
        };
        await testRequest(request, expectedResponse, { json: true });
    });

    test('should send correct request and receive binary stream response', async () => {
        const expectedResponse = {
            data: crypto.randomBytes(10000),
            statusCode: 200,
            headers: {
                'content-encoding': 'gzip',
                'x-other-header': 'other-content'
            }
        };
        const request = {
            protocol: 'http',
            host: '192.168.0.6',
            uri: '/login',
            body: 'some body',
            query: {
                a: 123,
                b: 'other param'
            }
        };
        await testRequest(request, expectedResponse, { stream: true });
    });

    test('should receive 404 error in stream', async () => {
        const expectedResponse = {
            data: { error: 'Error Message' },
            statusCode: 404,
            headers: {
                'content-type': 'application/json',
                'x-other-header': 'other-content'
            }
        };
        const request = {
            protocol: 'http',
            host: 'www.example.com',
            uri: '/login',
            body: 'some body',
            query: {
                a: 123,
                b: 'other param'
            }
        };
        const responseType = { stream: true, json: true };
        const resp = await executeRequest(request, expectedResponse, responseType);

        expect(resp.originalRequest).toBeDefined();
        expect(resp.response.status).toEqual(expectedResponse.statusCode);
        expect(resp.response.headers.toJSON()).toEqual(expectedResponse.headers);

        const data = await parseStreamData(resp.response.data, expectedResponse, responseType);
        expect(data).toEqual(expectedResponse.data);
    });

    test('should receive 404 error', async () => {
        const expectedResponse = {
            data: { error: 'Error Message' },
            statusCode: 404,
            headers: {
                'content-type': 'application/json',
                'x-other-header': 'other-content'
            }
        };
        const request = {
            protocol: 'http',
            host: 'www.example.com',
            uri: '/login',
            body: 'some body',
            query: {
                a: 123,
                b: 'other param'
            }
        };

        const resp = await executeRequest(request, expectedResponse, { stream: false, json: true });
        expect(resp.originalRequest).toBeDefined();
        expect(resp.response.data).toEqual(expectedResponse.data);
        expect(resp.response.status).toEqual(expectedResponse.statusCode);
        expect(resp.response.headers.toJSON()).toEqual(expectedResponse.headers);
    });
});

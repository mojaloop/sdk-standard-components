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
 * Eugen Klymniuk <eugen.klymniuk@infitx.com>

 --------------
 ******/

const https = require('node:https');
const querystring = require('node:querystring');
const AxiosHttpRequester = require('#src/lib/httpRequester/AxiosHttpRequester');
const { createHttpRequester } = require('#src/lib/httpRequester/index');
const { ResponseType } = require('#src/lib/httpRequester/constants');
const { mockAxios, mockGetReply, jsonContentTypeHeader } = require('#test/unit/utils');

const makeMockUri = route => `http://localhost:1234${route}`;

describe('AxiosHttpRequester Test -->', () => {
    let http;

    beforeEach(() => {
        mockAxios.reset();
        http = createHttpRequester();
    });

    test('should create and instance of AxiosHttpRequester', () => {
        expect(http).toBeInstanceOf(AxiosHttpRequester);
    });

    test('should fail with statusCode 404, when uri is not registered in mockAxios', async () => {
        expect.hasAssertions();
        const uri = 'arbitrary-uri';
        await http.sendRequest({ uri, responseType: 'text' })
            .catch(err => {
                expect(err.status).toBe(404);
            });
    });

    test('should send mock GET request', async () => {
        const route = '/test';
        const statusCode = 200;
        const data = { id: Date.now() };
        const headers = jsonContentTypeHeader;
        mockGetReply({ route, statusCode, data, headers });

        const response = await http.sendRequest({
            uri: makeMockUri(route),
            method: 'GET',
            headers: {},
        });
        expect(response.statusCode).toBe(statusCode);
        expect(response.data).toEqual(data);
        expect(response.headers).toEqual(headers);
        expect(response.originalRequest.headers).toEqual({});
    });

    test('should throw error on any erroneous statusCode', async () => {
        expect.hasAssertions();
        const route = '/error';
        const statusCode = 500;
        const data = { message: 'error' };
        mockGetReply({ route, statusCode, data });

        await http.sendRequest({ uri: makeMockUri(route) })
            .catch(err => {
                expect(err.status).toBe(statusCode);
                expect(err.response.data).toEqual(data);
            });
    });

    test('should have response JSON content-type header validation', async () => {
        expect.hasAssertions();
        const route = '/content';
        const statusCode = 200;
        const headers = { 'content-type': 'text/html' };
        mockGetReply({ route, statusCode, headers });

        await http.sendRequest({
            responseType: ResponseType.JSON,
            uri: makeMockUri(route),
            method: 'GET',
            headers: {},
        }).catch(err => {
            expect(err.originalRequest).toBeDefined();
            expect(err.statusCode).toBe(statusCode);
            expect(err.contentType).toBe(headers['content-type']);
            expect(err.response).toBeUndefined();
        });
    });

    describe('convertToAxiosOptions Tests -->', () => {
        test('should add http protocol, if no protocol in uri', () => {
            const uri = '8.8.8.8:1234';
            const converted = http.convertToAxiosOptions({ uri});
            expect(converted.baseURL).toBe(`http://${uri}`);
        });

        test('should NOT add http protocol, if uri has it', () => {
            const uri = 'http://8.8.8.8:1234';
            const converted = http.convertToAxiosOptions({ uri});
            expect(converted.baseURL).toBe(uri);
        });

        test('should add http protocol, and define root url', () => {
            const uri = '127.0.0.2';
            const converted = http.convertToAxiosOptions({ uri});
            expect(converted.baseURL).toBe(`http://${uri}`);
        });

        test('should create route url part with search and hash', () => {
            const serverUrl = 'http://localhost:1234';
            const route = '/route?x=33';
            const hash = '#123';
            const qs = { a: 1, b: 2 };
            const httpOpts = {
                uri: `${serverUrl}${route}${hash}`,
                qs,
            };
            const converted = http.convertToAxiosOptions(httpOpts);
            expect(converted.baseURL).toBe(serverUrl);
            expect(converted.url).toBe(`${route}&${querystring.encode(qs)}${hash}`);
        });

        test('should set proper httpsAgent field', () => {
            const httpOpts = {
                uri: 'http://localhost:1234',
                agent: new https.Agent(),
            };
            const converted = http.convertToAxiosOptions(httpOpts);
            expect(converted.httpsAgent).toBeInstanceOf(https.Agent);
        });

        test('should not set agent field, if it is missed in httpOpts', () => {
            const httpOpts = { uri: 'http://localhost:1234' };
            const converted = http.convertToAxiosOptions(httpOpts);
            expect(converted.httpsAgent).toBeUndefined();
            expect(converted.httpAgent).toBeUndefined();
            expect(converted.agent).toBeUndefined();
        });
    });

    describe('retry Tests -->', () => {
        beforeEach(() => {
            mockAxios.reset();
        });

        test('should retry request on network error', async () => {
            const route = '/error';
            mockAxios
                .onGet(route).networkErrorOnce()
                .onGet(route).reply(200, {});
            const response = await http.sendRequest({ uri: makeMockUri(route) });
            expect(response.statusCode).toBe(200);
        });

        test('should fail with error on max retries exceed for an http request', async () => {
            expect.hasAssertions();
            const route = '/error';
            mockAxios.onGet(route).networkError();

            await http.sendRequest({ uri: makeMockUri(route) })
                .catch(err => {
                    expect(err.message).toBe('Network Error');
                });
        });

        test('should retry on retryable server error (e.g. 503)', async () => {
            const route = '/server';
            mockAxios
                .onGet(route).replyOnce(503)
                .onGet(route).reply(200, {});
            const response = await http.sendRequest({ uri: makeMockUri(route) });
            expect(response.statusCode).toBe(200);
        });

        test('should NOT retry on badRequest error', async () => {
            expect.hasAssertions();
            const route = '/bad';
            mockAxios.onGet(route).reply(400);
            await http.sendRequest({ uri: makeMockUri(route) })
                .catch(err => {
                    expect(err.status).toBe(400);
                });
        });

        test('should retry request on timeout', async () => {
            const route = '/timeout';
            mockAxios
                .onGet(route).timeoutOnce()
                .onGet(route).reply(200, {});
            const response = await http.sendRequest({ uri: makeMockUri(route) });
            expect(response.statusCode).toBe(200);
        });

        test('should be able to override retry defaults using env vars', () => {
            jest.resetModules(); // to clean up module require cache
            const newRetries = 0;
            process.env.HTTP_DEFAULT_RETRIES = String(newRetries);
            const newHttp = require('#src/lib/httpRequester/index').createHttpRequester();
            expect(newHttp.deps.retryConfig.retries).toBe(newRetries);
            expect(http.deps.retryConfig.retries).toBeGreaterThan(newRetries);
        });
    });
});

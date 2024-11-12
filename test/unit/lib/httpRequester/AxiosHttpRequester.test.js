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

    test('should return object with statusCode 404, when uri is not registered in mockAxios', async () => {
        const uri = 'arbitrary-uri';
        const response = await http.sendRequest({ uri, responseType: 'text' });
        expect(response.statusCode).toBe(404);
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

    test('should NOT throw error on any erroneous statusCode', async () => {
        const route = '/error';
        const statusCode = 500;
        const data = { message: 'error' };
        mockGetReply({ route, statusCode, data });

        const response = await http.sendRequest({ uri: makeMockUri(route) });
        expect(response.statusCode).toBe(statusCode);
        expect(response.data).toEqual(data);
    });

    // test('should throw error on erroneous response statusCode', async () => {
    //     expect.hasAssertions();
    //     const route = '/error';
    //     const statusCode = 500;
    //     const data = { message: 'error' };
    //     const headers = {
    //         ...jsonContentTypeHeader,
    //         'test': 'x'
    //     };
    //     mockGetReply({ route, statusCode, data, headers });
    //
    //     await http.sendRequest({
    //         uri: makeMockUri(route),
    //         method: 'GET',
    //         headers: {},
    //     }).catch(err => {
    //         expect(err.message).toBe(`Request failed with status code ${statusCode}`);
    //         expect(err.originalRequest).toBeDefined();
    //         expect(err.response.data).toEqual(data);
    //         expect(err.response.headers.toJSON()).toEqual(headers);
    //     });
    // });

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

    describe('convertToAxiosOptions -->', () => {
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
});

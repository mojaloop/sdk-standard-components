const AxiosHttpRequester = require('#src/lib/httpRequester/AxiosHttpRequester');
const { createHttpRequester } = require('#src/lib/httpRequester/index');
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

    test('should throw error on invalid uri', async () => {
        const uri = 'invalid-uri';
        await expect(() => http.sendRequest({ uri }))
            .rejects.toThrow('Invalid URL');
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

    test('should have response content-type header validation', async () => {
        expect.hasAssertions();
        const route = '/content';
        const statusCode = 200;
        const headers = { 'content-type': 'text/html' };
        mockGetReply({ route, statusCode, headers });

        await http.sendRequest({
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
});

/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2020 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha - yevhen.kyriukha@modusbox.com                   *
 **************************************************************************/

const { mockAxios } = require('#test/unit/utils');

const { Readable } = require('node:stream');
const fs = require('node:fs');
const crypto = require('node:crypto');
const querystring = require('querystring');

const mr = require('../../../../src/lib/requests/mojaloopRequests.js');
const WSO2Auth = require('../../../../src/lib/WSO2Auth');
const mockLogger = require('../../../__mocks__/mockLogger');

const jwsSigningKey = fs.readFileSync(__dirname + '/../../data/jwsSigningKey.pem');
const logger = mockLogger({ app: 'request-test' });

describe('mojaloopRequests Tests', () => {
    beforeEach(() => {
        mockAxios.reset();
    });

    function streamToBuffer(stream) {
        const chunks = [];
        return new Promise((resolve, reject) => {
            stream.on('data', chunk => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }

    const toStream = data => Readable.from( data instanceof Buffer
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

        const wso2Auth = new WSO2Auth({ logger });

        // Everything is false by default
        const conf = {
            logger,
            peerEndpoint: request.host,
            tls: {
                mutualTLS: { enabled: false }
            },
            jwsSign: true,
            jwsSignPutParties: true,
            jwsSigningKey: jwsSigningKey,
            wso2Auth,
        };
        const testMr = new mr(conf);
        const resp = await testMr.postCustom(request.uri, request.body, request.headers, request.query, responseType.stream)
            .catch(err => err);

        await wso2Auth.stop();

        return resp;
    };

    async function testRequest(request, expectedResponse, responseType) {
        const resp = await executeRequest(request, expectedResponse, responseType);

        expect(resp.originalRequest.data).toEqual(request.body);
        expect(resp.originalRequest.headers).toBeDefined();
        expect(resp.originalRequest.url).toBeDefined();

        if(!expectedResponse.originalRequest) {
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
                'x-other-header': 'other-content',
            },
        };
        const request = {
            protocol: 'http',
            host: 'www.example.com',
            uri: '/login',
            body: 'some body',
            query: {
                a: 123,
                b: 'other param',
            },
        };
        await testRequest(request, expectedResponse, { json: true });
    });

    test('should send correct request and receive stream response', async () => {
        const expectedResponse = {
            data: { id: '123ABC' },
            statusCode: 200,
            headers: {
                'content-type': 'application/json',
                'x-other-header': 'other-content',
            },
        };
        const request = {
            protocol: 'http',
            host: 'www.example.com',
            uri: '/login',
            body: 'some body',
            query: {
                a: 123,
                b: 'other param',
            },
        };
        await testRequest(request, expectedResponse, { json: true });
    });

    test('should send correct request and receive binary stream response', async () => {
        const expectedResponse = {
            data: crypto.randomBytes(10000),
            statusCode: 200,
            headers: {
                'content-encoding': 'gzip',
                'x-other-header': 'other-content',
            },
        };
        const request = {
            protocol: 'http',
            host: '192.168.0.6',
            uri: '/login',
            body: 'some body',
            query: {
                a: 123,
                b: 'other param',
            },
        };
        await testRequest(request, expectedResponse, { stream: true });
    });

    test('should receive 404 error in stream', async () => {
        const expectedResponse = {
            data: { error: 'Error Message' },
            statusCode: 404,
            headers: {
                'content-type': 'application/json',
                'x-other-header': 'other-content',
            },
        };
        const request = {
            protocol: 'http',
            host: 'www.example.com',
            uri: '/login',
            body: 'some body',
            query: {
                a: 123,
                b: 'other param',
            },
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
                'x-other-header': 'other-content',
            },
        };
        const request = {
            protocol: 'http',
            host: 'www.example.com',
            uri: '/login',
            body: 'some body',
            query: {
                a: 123,
                b: 'other param',
            },
        };

        const resp = await executeRequest(request, expectedResponse, { stream: false, json: true });
        expect(resp.originalRequest).toBeDefined();
        expect(resp.response.data).toEqual(expectedResponse.data);
        expect(resp.response.status).toEqual(expectedResponse.statusCode);
        expect(resp.response.headers.toJSON()).toEqual(expectedResponse.headers);
    });
});

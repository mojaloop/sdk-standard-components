/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2020 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha - yevhen.kyriukha@modusbox.com                   *
 **************************************************************************/

const fs = require('fs');
const querystring = require('querystring');
const crypto = require('crypto');
const nock = require('nock');

const mr = require('../../../../lib/requests/mojaloopRequests.js');
const WSO2Auth = require('../../../../lib/WSO2Auth');
const mockLogger = require('../../../__mocks__/mockLogger');


const jwsSigningKey = fs.readFileSync(__dirname + '/../../data/jwsSigningKey.pem');

describe('request', () => {
    function streamToBuffer(stream) {
        const chunks = [];
        return new Promise((resolve, reject) => {
            stream.on('data', chunk => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }

    async function testRequest(request, expectedResponse, responseType) {
        const qs = querystring.encode(request.query);
        nock(`${request.protocol}://${request.host}`)
            .post(request.uri + (qs ? `?${qs}` : ''), request.body)
            .reply(expectedResponse.statusCode, expectedResponse.data, expectedResponse.headers);

        const wso2Auth = new WSO2Auth({logger: console});

        // Everything is false by default
        const conf = {
            logger: mockLogger({ app: 'request-test' }),
            peerEndpoint: request.host,
            tls: {
                mutualTLS: {
                    enabled: false
                }
            },
            jwsSign: true,
            jwsSignPutParties: true,
            jwsSigningKey: jwsSigningKey,
            wso2Auth,
        };

        const testMr = new mr(conf);
        const resp = await testMr.postCustom(request.uri, request.body, request.headers, request.query, responseType.stream);
        let { data } = resp;
        if (responseType.stream) {
            data = await streamToBuffer(data);
            if (typeof expectedResponse.data === 'object' && responseType.json) {
                data = JSON.parse(data);
            }
        }
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
        await testRequest(request, expectedResponse, { stream: true, json: true });
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
        await testRequest(request, expectedResponse, { stream: false, json: true });
    });
});

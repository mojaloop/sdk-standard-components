/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - james.bush@modusbox.com                             *
 **************************************************************************/

const http = require('http');
jest.mock('http');

const BaseRequests = require('../../../../src/lib/requests/baseRequests');
// const WSO2Auth = require('../../../../lib/WSO2Auth');
const mockLogger = require('../../../__mocks__/mockLogger');
const { ApiType } = require('../../../../src/lib/requests/apiTransformer');

const postQuotesBody = require('../../data/quoteRequest.json');
const putPartiesBody = require('../../data/putPartiesBody.json');
const patchTransfersBody = require('../../data/patchTransfersBody.json');


// utility function that return a mock http ClientRequest type object which will complete a request and allow seeing
// the sent headers and body etc...
const getReqMock = (options, callback) => {
    return {
        on: jest.fn(),
        write: jest.fn(() => {
            console.log('reqMock.write called');
            return true;
        }),
        end: jest.fn().mockImplementation(() => {
            console.log('reqMock.end called');
            const mr = {
                statusCode: 202,
                headers: {
                    'content-type': 'application/json',
                },
                on: jest.fn((event, eventCallback) => {
                    if (event === 'data') {
                        // simulate response data
                        console.log('sending mock resposne body');
                        eventCallback(Buffer.from('{ "message": "mock response body" }'));
                    }
                    if (event === 'end') {
                        // simulate end of response
                        console.log('simulating end of response');
                        eventCallback();
                    }
                }),
            };
            callback(mr);
        }),
    };
};

describe('BaseRequests wso2 authorisation', () => {
    let wso2Auth, defaultConf;

    beforeEach(() => {
        wso2Auth = {
            refreshToken: jest.fn(() => 'fake-token'),
        };
        defaultConf = {
            logger: mockLogger({ app: 'BaseRequests test' }, undefined),
            peerEndpoint: '127.0.0.1',
            tls: {
                mutualTLS: {
                    enabled: false
                }
            },
        };
        http.__request = jest.fn(() => ({ statusCode: 401 }));
    });

    afterEach(() => {
        http.__request.mockClear();
    });

    it('does not retry requests when not configured to do so', async () => {
        const conf = {
            ...defaultConf,
            wso2: {
                auth: wso2Auth,
                // retryWso2AuthFailureTimes: undefined, // the default
            }
        };

        const br = new BaseRequests(conf);
        await br._request({ uri: 'http://what.ever' });

        expect(http.__request).toBeCalledTimes(1);
        expect(wso2Auth.refreshToken).not.toBeCalled();
    });

    it('retries requests once when configured to do so', async () => {
        const conf = {
            ...defaultConf,
            wso2: {
                auth: wso2Auth,
                retryWso2AuthFailureTimes: 1,
            },
        };

        http.__request = jest.fn(() => ({ statusCode: 401 }));

        const br = new BaseRequests(conf);
        await br._request({ uri: 'http://what.ever', headers: {} });

        expect(http.__request).toBeCalledTimes(conf.wso2.retryWso2AuthFailureTimes + 1);
        expect(wso2Auth.refreshToken).toBeCalledTimes(conf.wso2.retryWso2AuthFailureTimes);
    });

    it('retries requests multiple times when configured to do so', async () => {
        const conf = {
            ...defaultConf,
            wso2: {
                auth: wso2Auth,
                retryWso2AuthFailureTimes: 5,
            },
        };

        http.__request = jest.fn(() => ({ statusCode: 401 }));

        const br = new BaseRequests(conf);
        await br._request({ uri: 'http://what.ever', headers: {} });

        expect(http.__request).toBeCalledTimes(conf.wso2.retryWso2AuthFailureTimes + 1);
        expect(wso2Auth.refreshToken).toBeCalledTimes(conf.wso2.retryWso2AuthFailureTimes);
    });
});

describe('BaseRequests', () => {
    let defaultConf;

    beforeEach(() => {
        defaultConf = {
            logger: mockLogger({ app: 'BaseRequests test' }, undefined),
            peerEndpoint: '127.0.0.1',
            tls: {
                mutualTLS: {
                    enabled: false
                }
            },
            dfspId: 'testdfsp',
        };
        http.__request = jest.fn(() => ({ statusCode: 200 }));
    });

    afterEach(() => {
        http.__request.mockClear();
    });

    it('returns original request details for GET calls when response type is mojaloop', async () => {
        const conf = {
            ...defaultConf,
        };

        const br = new BaseRequests(conf);
        const res = await br._get('parties/MSISDN/1234567',
            'parties',
            'somefsp');

        expect(res).not.toBeUndefined();
        expect(res.originalRequest).not.toBeUndefined();
    });

    it('returns original request details for POST calls when response type is mojaloop', async () => {
        const conf = {
            ...defaultConf,
        };

        const br = new BaseRequests(conf);
        const res = await br._post('quotes',
            'quotes',
            {},
            'somefsp');

        expect(res).not.toBeUndefined();
        expect(res.originalRequest).not.toBeUndefined();
    });

    it('returns original request details for PUT calls when response type is mojaloop', async () => {
        const conf = {
            ...defaultConf,
        };

        const br = new BaseRequests(conf);
        const res = await br._put('quotes/1234567',
            'quotes',
            {},
            'somefsp');

        expect(res).not.toBeUndefined();
        expect(res.originalRequest).not.toBeUndefined();
    });

    it('returns original request details for PATCH calls when response type is mojaloop', async () => {
        const conf = {
            ...defaultConf,
        };

        const br = new BaseRequests(conf);
        const res = await br._patch('transfers/1234567',
            'transfers',
            {},
            'somefsp');

        expect(res).not.toBeUndefined();
        expect(res.originalRequest).not.toBeUndefined();
    });

    it('constructs an apiTransformer upon construction', async () => {
        const conf = {
            ...defaultConf,
        };

        const br = new BaseRequests(conf);

        expect(br._apiTransformer).not.toBeUndefined();
    });

    it('transforms an FSPIOP POST request to an ISO20022 POST request when API type is ISO20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022,
        };

        // mock the http request method so we can see the sent body
        // yeah, this is more complicated than it should be.
        http.request = jest.fn((options, callback) => {
            return getReqMock(options, callback);
        });

        const br = new BaseRequests(conf);

        const res = await br._post('quotes',
            'quotes',
            postQuotesBody,
            'somefsp',
            undefined,
            undefined,
            undefined,
            { SubId: 'abc' });

        const reqBody = JSON.parse(res.originalRequest.body);

        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.iso20022.quotes+json;version=1.0');

        // check the body was converted to ISO20022
        // note that we dont check that the content of the ISO body is correct, that is up to the tests around the
        // transformer lib. We just check if the body was changed to an iso form by looking for one or two expected
        // values.
        expect(reqBody.GrpHdr).not.toBeUndefined();
    });

    it('transforms an FSPIOP PUT request to an ISO20022 PUT request when API type is ISO20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022,
        };

        // mock the http request method so we can see the sent body
        // yeah, this is more complicated than it should be.
        http.request = jest.fn((options, callback) => {
            return getReqMock(options, callback);
        });

        const br = new BaseRequests(conf);

        const res = await br._put('parties/MSISDN/0123456789',
            'parties',
            putPartiesBody,
            'somefsp',
            undefined,
            undefined,
            undefined,
            { Type: 'MSISDN', ID: '0123456789' });

        const reqBody = JSON.parse(res.originalRequest.body);

        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.iso20022.parties+json;version=1.0');

        // check the body was converted to ISO20022
        // note that we dont check that the content of the ISO body is correct, that is up to the tests around the
        // transformer lib. We just check if the body was changed to an iso form by looking for one or two expected
        // values.
        expect(reqBody.Assgnmt).not.toBeUndefined();
        expect(reqBody.Rpt).not.toBeUndefined();
        expect(reqBody.Rpt.OrgnlId).toEqual('MSISDN/0123456789');
    });

    it('transforms an FSPIOP PATCH request to an ISO20022 PATCH request when API type is ISO20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022,
        };

        // mock the http request method so we can see the sent body
        // yeah, this is more complicated than it should be.
        http.request = jest.fn((options, callback) => {
            return getReqMock(options, callback);
        });

        const br = new BaseRequests(conf);

        const res = await br._patch('transfers/20508186-1458-4ac0-a824-d4b07e37d7b3',
            'transfers',
            patchTransfersBody,
            'somefsp',
            undefined,
            undefined,
            undefined,
            undefined);

        const reqBody = JSON.parse(res.originalRequest.body);

        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.iso20022.transfers+json;version=1.0');

        // check the body was converted to ISO20022
        // note that we dont check that the content of the ISO body is correct, that is up to the tests around the
        // transformer lib. We just check if the body was changed to an iso form by looking for one or two expected
        // values.
        expect(reqBody.GrpHdr).not.toBeUndefined();
        expect(reqBody.TxInfAndSts).not.toBeUndefined();
    });
});

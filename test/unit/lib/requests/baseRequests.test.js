/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - james.bush@modusbox.com                             *
 **************************************************************************/

jest.mock('http');
const http = require('http');

const BaseRequests = require('../../../../src/lib/requests/baseRequests');
// const WSO2Auth = require('../../../../lib/WSO2Auth');
const mockLogger = require('../../../__mocks__/mockLogger');

describe('BaseRequests wso2 authorisation', () => {
    let wso2Auth, defaultConf;

    beforeEach(() => {
        wso2Auth = {
            refreshToken: jest.fn(() => 'fake-token'),
        };
        defaultConf = {
            logger: mockLogger({ app: 'BaseRequests test' }, undefined, false),
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
            logger: mockLogger({ app: 'BaseRequests test' }, undefined, false),
            peerEndpoint: '127.0.0.1',
            tls: {
                mutualTLS: {
                    enabled: false
                }
            },
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
});

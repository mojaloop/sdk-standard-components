/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha - yevhen.kyriukha@modusbox.com                   *
 **************************************************************************/

const { mockAxios, jsonContentTypeHeader } = require('../unit/utils');

const WSO2Auth = require('../../src/lib/WSO2Auth');
const mockLogger = require('../__mocks__/mockLogger');

describe('WSO2Auth', () => {
    let mockOpts, basicToken;

    beforeEach(() => {
        const clientKey = 'client-key';
        const clientSecret = 'client-secret';
        mockOpts = {
            logger: mockLogger({ app: 'wso2-auth' }, undefined),
            clientKey,
            clientSecret,
            tokenEndpoint: 'http://token-endpoint.com/v2',
            refreshSeconds: 2,
        };
        basicToken = Buffer.from(`${clientKey}:${clientSecret}`).toString('base64');
    });

    async function testTokenRefresh(userRefreshSeconds, tokenExpiresSeconds) {
        const TOKEN = 'new-token';
        const tokenExpirySeconds = ((typeof tokenExpiresSeconds === 'number') && (tokenExpiresSeconds > 0))
            ? tokenExpiresSeconds : Infinity;
        const actualRefreshMs = Math.min(userRefreshSeconds, tokenExpirySeconds) * 1000;
        const opts = {
            ...mockOpts,
            refreshSeconds: userRefreshSeconds,
        };
        const now = Date.now();
        let tokenRefreshTime = now;

        mockAxios.reset();
        mockAxios.onPost().reply(200, {
            access_token: TOKEN,
            expires_in: tokenExpiresSeconds,
        }, jsonContentTypeHeader);

        const auth = new WSO2Auth(opts);
        await auth.start();
        const token = auth.getToken();

        expect(mockAxios.history.post.length).toBe(1);
        expect(mockAxios.history.post[0].headers['Authorization']).toBe(`Basic ${basicToken}`);
        expect(token).toBe(TOKEN);
        // Wait for token refresh
        await new Promise(resolve => {
            setTimeout(() => resolve(), actualRefreshMs + 100);
        });
        expect(mockAxios.history.post.length).toBe(2);
        const tokenRefreshInterval = tokenRefreshTime - now;
        expect(tokenRefreshInterval - actualRefreshMs).toBeLessThan(500);
        auth.stop();
    }

    test('should return static token when static token was provided', async () => {
        const TOKEN = 'abc123';
        const auth = new WSO2Auth({
            logger: mockLogger({ app: 'wso2-auth' }, undefined),
            staticToken: TOKEN,
            refreshSeconds: 2,
        });
        await auth.start();
        const token = auth.getToken();
        expect(token).toBe(TOKEN);
        auth.stop();
    });

    test('should return new token when token API info was provided', async () => {
        const TOKEN = 'new-token';
        const opts = mockOpts;
        mockAxios.reset();
        mockAxios.onPost().reply(200, { access_token: TOKEN }, jsonContentTypeHeader);

        const auth = new WSO2Auth(opts);
        await auth.start();
        const token = auth.getToken();
        expect(mockAxios.history.post.length).toBe(1);
        expect(mockAxios.history.post[0].headers['Authorization']).toBe(`Basic ${basicToken}`);
        expect(token).toBe(TOKEN);
        auth.stop();
    });

    test(
        'should refresh token using user provided interval value',
        () => testTokenRefresh(3, 1000)
    );

    test(
        'should refresh token using user provided interval value when token expiry is negative',
        () => testTokenRefresh(3, -1)
    );

    test(
        'should refresh token using user provided interval value when token expiry is string',
        () => testTokenRefresh(3, '1')
    );

    test(
        'should refresh token using OAuth2 token expiry value',
        () => testTokenRefresh(4, 3)
    );

    test('should emit error when receiving a 401 from WSO2', async () => {
        const opts = mockOpts;
        mockAxios.reset();
        mockAxios.onPost().reply(401, null, jsonContentTypeHeader);
        const auth = new WSO2Auth(opts);
        const errCallback = jest.fn();
        auth.on('error', errCallback);
        await auth.start();
        expect(mockAxios.history.post.length).toBe(1);
        expect(mockAxios.history.post[0].headers['Authorization']).toBe(`Basic ${basicToken}`);
        expect(errCallback).toHaveBeenCalledTimes(1);
        auth.stop();
    });
});

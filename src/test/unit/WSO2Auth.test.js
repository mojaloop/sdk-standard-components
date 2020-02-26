/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha - yevhen.kyriukha@modusbox.com                   *
 **************************************************************************/

jest.mock('request-promise-native');
const request = require('request-promise-native');
const WSO2Auth = require('../../lib/WSO2Auth');

describe('WSO2Auth', () => {

    const loggerStub = {
        log() {}
    };

    async function testTokenRefresh(userRefreshSeconds, tokenExpiresSeconds) {
        const TOKEN = 'new-token';
        const tokenExpirySeconds = ((typeof tokenExpiresSeconds === 'number') && (tokenExpiresSeconds > 0))
            ? tokenExpiresSeconds : Infinity;
        const actualRefreshMs = Math.min(userRefreshSeconds, tokenExpirySeconds) * 1000;
        const opts = {
            logger: loggerStub,
            clientKey: 'client-key',
            clientSecret: 'client-secret',
            tokenEndpoint: 'token-endpoint',
            refreshSeconds: userRefreshSeconds,
        };
        const basicToken = Buffer.from(`${opts.clientKey}:${opts.clientSecret}`)
            .toString('base64');
        const now = Date.now();
        let tokenRefreshTime = now;

        const requestSpy = request.mockImplementation(async () => {
            tokenRefreshTime = Date.now();
            return {access_token: TOKEN, expires_in: tokenExpiresSeconds};
        });

        const auth = new WSO2Auth(opts);
        await auth.start();
        const token = auth.getToken();
        expect(requestSpy).toHaveBeenCalledTimes(1);
        expect(requestSpy.mock.calls[0][0].headers['Authorization']).toBe(`Basic ${basicToken}`);
        expect(token).toBe(TOKEN);
        // Wait for token refresh
        await new Promise(resolve => {
            setTimeout(() => resolve(), actualRefreshMs + 100);
        });
        expect(requestSpy).toHaveBeenCalledTimes(2);
        const tokenRefreshInterval = tokenRefreshTime - now;
        expect(tokenRefreshInterval - actualRefreshMs).toBeLessThan(500);
        auth.stop();
        requestSpy.mockClear();
    }

    test('should return static token when static token was provided', async () => {
        const TOKEN = 'abc123';
        const auth = new WSO2Auth({
            logger: loggerStub,
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
        const opts = {
            logger: loggerStub,
            clientKey: 'client-key',
            clientSecret: 'client-secret',
            tokenEndpoint: 'token-endpoint',
            refreshSeconds: 2,
        };
        const basicToken = Buffer.from(`${opts.clientKey}:${opts.clientSecret}`)
            .toString('base64');
        const requestSpy = request.mockImplementation(async () => ({access_token: TOKEN}));
        const auth = new WSO2Auth(opts);
        await auth.start();
        const token = auth.getToken();
        expect(requestSpy).toHaveBeenCalledTimes(1);
        expect(requestSpy.mock.calls[0][0].headers['Authorization']).toBe(`Basic ${basicToken}`);
        expect(token).toBe(TOKEN);
        auth.stop();
        requestSpy.mockClear();
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

});

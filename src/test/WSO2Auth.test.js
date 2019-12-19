/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha - yevhen.kyriukha@modusbox.com                   *
 **************************************************************************/

const test = require('ava');
const request = require('request-promise-native');
const WSO2Auth = require('../lib/WSO2Auth');
const sinon = require('sinon');

const loggerStub = {
    log() {}
};

let sandbox;

test.beforeEach(() => {
    sandbox = sinon.createSandbox();
});

test.afterEach.always(() => {
    sandbox.restore();
});

async function testTokenRefresh(t, userRefreshSeconds, tokenExpiresSeconds) {
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
    sandbox.stub(request, 'Request').callsFake(async () => {
        tokenRefreshTime = Date.now();
        return {access_token: TOKEN, expires_in: tokenExpiresSeconds};
    });
    const auth = new WSO2Auth(opts);
    await auth.start();
    const token = auth.getToken();
    t.assert(request.Request.calledOnce);
    t.is(request.Request.getCall(0).args[0].headers['Authorization'], `Basic ${basicToken}`);
    t.is(token, TOKEN);
    // Wait for token refresh
    await new Promise(resolve => {
        setTimeout(() => resolve(), actualRefreshMs + 100);
    });
    t.assert(request.Request.calledTwice);
    const tokenRefreshInterval = tokenRefreshTime - now;
    t.assert((tokenRefreshInterval - actualRefreshMs) < 500);
    auth.stop();
}

test('should return static token when static token was provided', async t => {
    const TOKEN = 'abc123';
    const auth = new WSO2Auth({
        logger: loggerStub,
        staticToken: TOKEN
    });
    await auth.start();
    const token = auth.getToken();
    t.is(token, TOKEN);
    auth.stop();
});

test.serial('should return new token when token API info was provided', async t => {
    const TOKEN = 'new-token';
    const opts = {
        logger: loggerStub,
        clientKey: 'client-key',
        clientSecret: 'client-secret',
        tokenEndpoint: 'token-endpoint'
    };
    const basicToken = Buffer.from(`${opts.clientKey}:${opts.clientSecret}`)
        .toString('base64');
    sandbox.stub(request, 'Request').resolves({access_token: TOKEN});
    const auth = new WSO2Auth(opts);
    await auth.start();
    const token = auth.getToken();
    t.assert(request.Request.calledOnce);
    t.is(request.Request.getCall(0).args[0].headers['Authorization'], `Basic ${basicToken}`);
    t.is(token, TOKEN);
    auth.stop();
});

test.serial('should refresh token using user provided interval value',  t =>
    testTokenRefresh(t, 3, 1000));

test.serial('should refresh token using user provided interval value when token expiry is negative',  t =>
    testTokenRefresh(t, 3, -1));

test.serial('should refresh token using user provided interval value when token expiry is string',  t =>
    testTokenRefresh(t, 3, '1'));

test.serial('should refresh token using OAuth2 token expiry value',  t =>
    testTokenRefresh(t, 4, 3));

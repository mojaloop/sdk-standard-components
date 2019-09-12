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
const WSO2Auth = require('../../../../lib/mojaloop-requests/wso2auth');
const sinon = require('sinon');

const loggerStub = {
    info() {},
    debug() {},
    error() {},
};

test.afterEach(() => {
    sinon.restore();
});

test('should return static token when static token was provided', async t => {
    const TOKEN = 'abc123';
    const auth = new WSO2Auth({
        logger: loggerStub,
        staticToken: TOKEN
    });
    t.is(await auth.getToken(), TOKEN);
});

test('should return new token when token API info was provided', async t => {
    const TOKEN = 'new-token';
    const opts = {
        logger: loggerStub,
        clientKey: 'client-key',
        clientSecret: 'client-secret',
        tokenEndpoint: 'token-endpoint'
    };
    const basicToken = Buffer.from(`${opts.clientKey}:${opts.clientSecret}`)
        .toString('base64');
    sinon.stub(request, 'Request').resolves({access_token: TOKEN});
    const auth = new WSO2Auth(opts);
    const token = await auth.getToken();
    t.assert(request.Request.calledOnce);
    t.is(request.Request.getCall(0).args[0].headers['Authorization'], `Basic ${basicToken}`);
    t.is(token, TOKEN);
});

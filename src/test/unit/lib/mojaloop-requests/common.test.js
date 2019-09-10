/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Murthy Kakarlamudi - murthy@modusbox.com                             *
 **************************************************************************/

const test = require('ava');
const Common = require('../../../../lib/mojaloop-requests/common');

test('pass if content-length is not populated in incoming http response', async t => {
    try {
        const response = {
            statusCode: 200,
            headers: {
                'content-type': 'application-json'
            },
            body: ''
        };
        await Common.throwOrJson(response);
        t.pass();
    } catch (error) {
        t.fail('Expect validation to pass');
    }
});

test('throw an error if content-length is greater than 0', async t => {
    try {
        const response = {
            statusCode: 200,
            headers: {
                'content-length': 10
            },
            body: ''
        };
        await Common.throwOrJson(response);

    } catch (error) {
        t.is(error.message, 'Expected empty response body but got content: ');
    }
});

test('throw an error if response code is <200', async t => {
    try {
        const response = {
            statusCode: 100,
            headers: {
                'content-length1': 0
            },
            body: ''
        };
        await Common.throwOrJson(response);

    } catch (err) {
        t.is(err.message, 'Request returned non-success status code 100');
    }
});
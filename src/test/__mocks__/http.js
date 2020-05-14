/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2020 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha - yevhen.kyriukha@modusbox.com                   *
 **************************************************************************/

const httpActual = jest.requireActual('http');
const http = jest.genMockFromModule('http');
const { Readable, Writable } = require('stream');

function request(options, callback) {
    if (!http.__request) {
        return httpActual.request(options, callback);
    }
    const response = http.__request(options);
    const buffer = response.data ? Buffer.from(JSON.stringify(response.data)) : Buffer.from('');
    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.headers = response.headers;
    readable.statusCode = response.statusCode;
    callback(readable);

    const writable = new Writable();
    writable._write = () => {};
    return writable;
}

http.__request = jest.fn(() => {});
http.request = request;
http.globalAgent = {};

module.exports = http;

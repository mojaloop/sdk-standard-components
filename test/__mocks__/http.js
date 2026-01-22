/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 * ModusBox
 - Yevhen Kyriukha - yevhen.kyriukha@modusbox.com - ORIGINAL AUTHOR

 --------------
 ******/

'use strict';

/* eslint-env jest */
/* global httpActual */

const http = jest.genMockFromModule('http');
const { Readable, Writable } = require('stream');

const writeMock = jest.fn();

function request (options, callback) {
    if (!http.__request) {
        return httpActual.request(options, callback);
    }
    const response = http.__request(options);
    const buffer = response.data ? Buffer.from(JSON.stringify(response.data)) : Buffer.from('');
    const readable = new Readable();
    readable._read = jest.fn();
    readable.push(buffer);
    readable.push(null);
    readable.headers = response.headers || { 'content-type': 'application/json' };
    readable.statusCode = response.statusCode;
    callback(readable);

    const writable = new Writable();
    writable._write = jest.fn();
    writable.write = writeMock;

    return writable;
}

http.__write = writeMock;
http.__request = jest.fn(() => {});
http.request = request;

module.exports = http;

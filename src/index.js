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
 - James Bush - james.bush@modusbox.com - ORIGINAL AUTHOR

 --------------
 ******/

'use strict';

const axios = require('axios');
const Errors = require('./lib/errors');
const Ilp = require('./lib/ilp');
const Jws = require('./lib/jws');
const Logger = require('./lib/logger');
const requests = require('./lib/requests');
const WSO2Auth = require('./lib/WSO2Auth');
const randomPhrase = require('./lib/randomphrase');
const httpRequester = require('./lib/httpRequester');
const utils = require('./lib/utils');

const { request } = httpRequester;
const { MojaloopRequests, ThirdpartyRequests, common } = requests;

module.exports = {
    axios, // to reuse in SDK tests
    Errors,
    Ilp,
    Jws,
    Logger,
    MojaloopRequests,
    ThirdpartyRequests,
    common,
    request,
    requests,
    httpRequester,
    WSO2Auth,
    randomPhrase,
    utils,
};

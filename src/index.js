/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - james.bush@modusbox.com                             *
 **************************************************************************/

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
};

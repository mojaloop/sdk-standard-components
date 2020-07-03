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

const util = require('util');
const respErrSym = Symbol('ResponseErrorDataSym');


/**
 * An HTTPResponseError class
 */
class HTTPResponseError extends Error {
    constructor(params) {
        super(params.msg);
        this[respErrSym] = params;
    }

    getData() {
        return this[respErrSym];
    }

    toString() {
        return util.inspect(this[respErrSym]);
    }

    toJSON() {
        return JSON.stringify(this[respErrSym]);
    }
}


// Strip all beginning and end forward-slashes from each of the arguments, then join all the
// stripped strings with a forward-slash between them. If the last string ended with a
// forward-slash, append that to the result.
const buildUrl = (...args) => {
    return args
        .filter(e => e !== undefined)
        .map(s => s.replace(/(^\/*|\/*$)/g, '')) /* This comment works around a problem with editor syntax highglighting */
        .join('/')
        + ((args[args.length - 1].slice(-1) === '/') ? '/' : '');
};


const throwOrJson = async (res) => {
    // Noticed that none of the backend sevices are returning this header, although this is mandated by API Spec.
    // This needs to be un-commented once the corresponding bug in the backend is fixed
    // if(!res.headers['content-type'] || (res.headers['content-type'].match(/^application\/vnd\.interoperability\.[a-z]+\+json$/) === null)) {
    //     // we should have got a valid mojaloop content-type in the response
    //     throw new HTTPResponseError({ msg: `Unexpected content-type header: ${res.headers['content-type']}`, res });
    // }


    // do this first - fail fast if we KNOW the request got an error response back
    // note that 404 will throw. This is correct  behavior for the mojaloop api.
    if(res.statusCode < 200 || res.statusCode >= 300) {
        // not a successful request
        throw new HTTPResponseError({ msg: `Request returned non-success status code ${res.statusCode}`,
            res
        });
    }

    // mojaloop api says that no body content should be returned directly - content is only returned asynchronously
    if ((res.headers['content-length']  && (res.headers['content-length'] !== '0' ) || (res.body && res.body.length > 0))) {
        throw new HTTPResponseError({ msg: `Expected empty response body but got content: ${res.body}`,
            res
        });
    }

    //return undefined as we do not expect body responses to mojaloop api requests
    return;
};

const bodyStringifier = (obj) => {
    if (typeof obj === 'string' || Buffer.isBuffer(obj))
        return obj;
    if (typeof obj === 'number')
        return obj.toString();
    return JSON.stringify(obj);
};

const ResponseType = Object.freeze({
    Mojaloop: Symbol('mojaloop'),
    Simple: Symbol('simple'),
    Stream: Symbol('stream')
});

/**
 * @function formatEndpointOrDefault
 * @description Format the endpoint based on the config's endpoint + transport scheme. Defaults to the default value if either
 *   endpoint or transportScheme is undefined or null
 * @param {string?} endpoint
 * @param {string?} transportScheme
 * @param {string} defaultEndpoint
 * @returns {string} The resolved formatted endpoint, or defaultEndpoint
 */
const formatEndpointOrDefault = (endpoint, transportScheme, defaultEndpoint) => {
    if (!endpoint || !transportScheme) {
        if (!defaultEndpoint) {
            throw new Error('defaultEndpoint must be set when endpoint or transportScheme are null or undefined');
        }
        return defaultEndpoint;
    }

    return `${transportScheme}://${endpoint}`;
};


module.exports = {
    bodyStringifier,
    buildUrl,
    formatEndpointOrDefault,
    HTTPResponseError,
    ResponseType,
    throwOrJson,
};

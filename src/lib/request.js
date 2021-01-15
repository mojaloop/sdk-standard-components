/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2020 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha - yevhen.kyriukha@modusbox.com                   *
 **************************************************************************/

const http = require('http');
const https = require('https');
const querystring = require('querystring');
const { URL } = require('url');

const ResponseType = Object.freeze({
    ArrayBuffer: Symbol('arraybuffer'),
    JSON:  Symbol('json'),
    Text: Symbol('text'),
    Stream: Symbol('stream'),
});

const request = async ({
    uri,
    qs = null,
    responseType = ResponseType.JSON,
    body = null,
    method,
    headers,
    agent,
}) => {
    const qsEnc = querystring.encode(qs);
    const completeUrl = new URL(uri + (qsEnc.length ? `?${qsEnc}` : ''));

    const reqOpts = {
        method,
        host: completeUrl.hostname,
        port: completeUrl.port,
        path: completeUrl.pathname + completeUrl.search + completeUrl.hash,
        headers,
        agent,
    };

    if (body) {
        reqOpts.headers['content-length'] = Buffer.byteLength(body);
    }

    const adapter = (completeUrl.protocol === 'https:') ? https : http;

    return new Promise((resolve, reject) => {
        const originalRequest = {
            ...reqOpts,
            agent: '[REDACTED]',
            body,
        };

        const req = adapter.request(reqOpts, (res) => {
            if (responseType === ResponseType.Stream) {
                return resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: res,
                    originalRequest,
                });
            }
            const data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => {
                let result = Buffer.concat(data);
                if (responseType === ResponseType.Text || !result.length) {
                    result = result.toString();
                } else if (responseType === ResponseType.JSON) {
                    const contentType = res.headers['content-type'];
                    if (!/^application\/json/.test(contentType)) {
                        let err = new Error('Invalid content-type. ' +
                            `Expected application/json but received ${contentType}`);
                        err.originalRequest = originalRequest;
                        return reject(err);
                    }
                    result = JSON.parse(result);
                }
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: result,
                    originalRequest,
                });
            });
        });

        req.on('error', (err) => {
            err.originalRequest = originalRequest;
            reject(err);
        });

        if (body) {
            req.write(body);
        }
        req.end();
    });
};

request.responseType = ResponseType;

module.exports = request;

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
    ArrayBuffer:   Symbol('arraybuffer'),
    JSON:  Symbol('json'),
    Text: Symbol('text'),
    Stream: Symbol('stream'),
});

const request = async (opts) => {
    const qs = querystring.encode(opts.qs);
    const completeUrl = new URL(opts.uri + (qs.length ? `?${qs}` : ''));

    const reqOpts = {
        method: opts.method,
        host: completeUrl.hostname,
        port: completeUrl.port,
        path: completeUrl.pathname + completeUrl.search + completeUrl.hash,
        headers: opts.headers,
        agent: opts.agent,
    };

    let responseType;
    if (opts.responseType) {
        responseType = opts.responseType;
    } else {
        responseType = ResponseType.JSON;
    }

    if (opts.body) {
        reqOpts.headers['content-length'] = Buffer.byteLength(opts.body);
    }

    const adapter = (completeUrl.protocol === 'https:') ? https : http;

    return new Promise((resolve, reject) => {
        const req = adapter.request(reqOpts, (res) => {
            if (responseType === ResponseType.Stream) {
                return resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: res,
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
                        return reject(new Error('Invalid content-type. ' +
                            `Expected application/json but received ${contentType}`));
                    }
                    result = JSON.parse(result);
                }
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: result,
                });
            });
        });

        req.on('error', reject);

        if (opts.body) {
            req.write(opts.body);
        }
        req.end();
    });
};

request.responseType = ResponseType;

module.exports = request;

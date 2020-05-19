/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha - yevhen.kyriukha@modusbox.com                   *
 **************************************************************************/

'use strict';

const http = require('http');
const https = require('https');
const qs = require('querystring');
const request = require('../request');

const DEFAULT_REFRESH_INTERVAL_SECONDS = 3600;
const DEFAULT_REFRESH_RETRY_INTERVAL_SECONDS = 10;

/**
 * Obtain WSO2 bearer token and periodically refresh it
 */
class WSO2Auth {
    /**
     *
     * @param {Object} opts
     * @param {Object} opts.logger
     * @param {String} [opts.tlsCreds]
     * @param {String} opts.tlsCreds.ca
     * @param {String} opts.tlsCreds.cert
     * @param {String} opts.tlsCreds.key
     * @param {String} [opts.clientKey] Customer Key
     * @param {String} [opts.clientSecret] Customer Secret
     * @param {String} [opts.tokenEndpoint] WSO2 Endpoint URL
     * @param {String} [opts.refreshSeconds] WSO2 token refresh interval in seconds
     * @param {String} [opts.refreshRetrySeconds] WSO2 token refresh retry interval in seconds
     * @param {String} [opts.staticToken] WSO2 static bearer token
     */
    constructor(opts) {
        this._logger = opts.logger;
        this._refreshSeconds = opts.refreshSeconds || DEFAULT_REFRESH_INTERVAL_SECONDS;
        this._refreshRetrySeconds = opts.refreshRetrySeconds || DEFAULT_REFRESH_RETRY_INTERVAL_SECONDS;
        this._stopped = false;

        if ((typeof this._refreshSeconds !== 'number') || (this._refreshSeconds <= 0)) {
            throw new Error('WSO2 auth config: refreshSeconds must be a positive integer value');
        }
        if ((typeof this._refreshRetrySeconds !== 'number') || (this._refreshRetrySeconds <= 0)) {
            throw new Error('WSO2 auth config: refreshRetrySeconds must be a positive integer value');
        }
        if (!this._logger) {
            throw new Error('WSO2 auth config requires logger property');
        }

        this._reqOpts = {
            method: 'POST',
            body: qs.stringify({
                grant_type: 'client_credentials'
            }),
        };

        if(opts.tlsCreds) {
            this._reqOpts.agent = new https.Agent({ ...opts.tlsCreds, keepAlive: true });
        }
        else {
            this._reqOpts.agent = http.globalAgent;
        }

        if (opts.tokenEndpoint && opts.clientKey && opts.clientSecret) {
            this._basicToken = Buffer.from(`${opts.clientKey}:${opts.clientSecret}`)
                .toString('base64');
            this._reqOpts.uri = opts.tokenEndpoint;
        } else if (opts.staticToken) {
            this._logger.log('WSO2 auth config token API data not set, fallback to static token');
            this._token = opts.staticToken;
        } else {
            // throw new Error('WSO2 auth error: neither token API data nor static token is set');
            this._token = null;
        }
    }

    async _refreshToken() {
        if (this._stopped) {
            this._logger.log('WSO2 token refresh stopped');
            return;
        }
        this._logger.log('WSO2 token refresh initiated');
        const reqOpts = {
            ...this._reqOpts,
            headers: {
                'Authorization': `Basic ${this._basicToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        };
        let refreshSeconds;
        try {
            const response = (await request(reqOpts)).data;
            this._token = response.access_token;
            const tokenIsValidNumber = (typeof response.expires_in === 'number') && (response.expires_in > 0);
            const tokenExpiry = tokenIsValidNumber ? response.expires_in : Infinity;
            refreshSeconds = Math.min(this._refreshSeconds, tokenExpiry);
            this._logger.log('WSO2 token refreshed successfully. ' +
                `Token expiry is ${response.expires_in}${tokenIsValidNumber ? 's' : ''}, ` +
                `next refresh in ${refreshSeconds}s`);
        } catch (error) {
            this._logger.log(`Error performing WSO2 token refresh: ${error.message}. `
                + `Retry in ${this._refreshRetrySeconds}s`);
            refreshSeconds = this._refreshRetrySeconds;
        }
        if (!this._stopped) {
            this._refreshTimer = setTimeout(this._refreshToken.bind(this), refreshSeconds * 1000);
        } else {
            this._logger.log('WSO2 token refresh stopped');
        }
    }

    getToken() {
        return this._token;
    }

    async start() {
        if (this._token === undefined) {
            await this._refreshToken();
        }
    }

    stop() {
        this._stopped = true;
        clearTimeout(this._refreshTimer);
    }
}

module.exports = WSO2Auth;

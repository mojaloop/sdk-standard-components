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
const request = require('request-promise-native');

const DEFAULT_REFRESH_INTERVAL_SECONDS = 3600;

/**
 * Obtain WSO2 bearer token and periodically refresh it
 */
class WSO2Auth {
    /**
     *
     * @param {Object} opts
     * @param {String} opts.logger
     * @param {String} [opts.tlsCreds]
     * @param {String} opts.tlsCreds.ca
     * @param {String} opts.tlsCreds.cert
     * @param {String} opts.tlsCreds.key
     * @param {String} [opts.clientKey] Customer Key
     * @param {String} [opts.clientSecret] Customer Secret
     * @param {String} [opts.tokenEndpoint] WSO2 Endpoint URL
     * @param {String} [opts.refreshSeconds] WSO2 token refresh interval in seconds
     * @param {String} [opts.staticToken] WSO2 static bearer token
     */
    constructor(opts) {
        this.logger = opts.logger;
        this.refreshSeconds = opts.refreshSeconds || DEFAULT_REFRESH_INTERVAL_SECONDS;
        this.stopped = false;

        if ((typeof this.refreshSeconds !== 'number') || (this.refreshSeconds <= 0)) {
            throw new Error('WSO2 auth config: token must be a positive integer value');
        }
        if (!this.logger) {
            throw new Error('WSO2 auth config requires logger property');
        }

        if(opts.tlsCreds) {
            this.agent = new https.Agent({ ...opts.tlsCreds, keepAlive: true });
        }
        else {
            this.agent = http.globalAgent;
        }

        if (opts.tokenEndpoint && opts.clientKey && opts.clientSecret) {
            this.basicToken = Buffer.from(`${opts.clientKey}:${opts.clientSecret}`)
                .toString('base64');
            this.endpoint = opts.tokenEndpoint;
        } else if (opts.staticToken) {
            this.logger.log('WSO2 auth config token API data not set, fallback to static token');
            this.token = opts.staticToken;
        } else {
            // throw new Error('WSO2 auth error: neither token API data nor static token is set');
            this.token = null;
        }
    }

    async _refreshToken() {
        if (this.stopped) {
            return;
        }
        this.logger.log('WSO2 token refresh initiated');
        const reqOpts = {
            agent: this.agent,
            method: 'POST',
            uri: this.endpoint,
            headers: {
                'Authorization': `Basic ${this.basicToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {
                grant_type: 'client_credentials'
            },
            json: true
        };
        try {
            const response = await request(reqOpts);
            this.token = response.access_token;
            const tokenExpiry = ((typeof response.expires_in === 'number') && (response.expires_in > 0))
                ? response.expires_in : Infinity;
            this.refreshSeconds = Math.min(this.refreshSeconds * 1000, tokenExpiry) / 1000;
            this.logger.log('WSO2 token refreshed successfully');
        } catch (error) {
            this.logger.log(`Error performing WSO2 token refresh: ${error.message}`);
        }
        setTimeout(this._refreshToken.bind(this), this.refreshSeconds * 1000);
    }

    getToken() {
        return this.token;
    }

    async start() {
        if (this.token === undefined) {
            await this._refreshToken();
        }
    }

    stop() {
        this.stopped = true;
    }
}

module.exports = WSO2Auth;

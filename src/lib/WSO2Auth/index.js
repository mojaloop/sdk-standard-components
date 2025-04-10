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

const http = require('http');
const https = require('https');
const qs = require('querystring');
const EventEmitter = require('events');
const { createHttpRequester } = require('../httpRequester');

const DEFAULT_REFRESH_INTERVAL_SECONDS = 3600;
const DEFAULT_REFRESH_RETRY_INTERVAL_SECONDS = 10;

/**
 * Obtain WSO2 bearer token and periodically refresh it
 */
class WSO2Auth extends EventEmitter {
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
        super({ captureExceptions: true });
        this._logger = opts.logger.child({ component: this.constructor.name });
        this._refreshSeconds = opts.refreshSeconds || DEFAULT_REFRESH_INTERVAL_SECONDS;
        this._refreshRetrySeconds = opts.refreshRetrySeconds || DEFAULT_REFRESH_RETRY_INTERVAL_SECONDS;

        if ((typeof this._refreshSeconds !== 'number') || (this._refreshSeconds <= 0)) {
            throw new Error('WSO2 auth config: refreshSeconds must be a positive integer value');
        }
        if ((typeof this._refreshRetrySeconds !== 'number') || (this._refreshRetrySeconds <= 0)) {
            throw new Error('WSO2 auth config: refreshRetrySeconds must be a positive integer value');
        }
        if (!this._logger) {
            throw new Error('WSO2 auth config requires logger property');
        }

        this._requester = createHttpRequester({ logger: this._logger });
        this._reqOpts = {
            method: 'POST',
            body: qs.stringify({
                grant_type: 'client_credentials'
            }),
        };

        if (opts.tlsCreds) {
            this._reqOpts.agent = new https.Agent({ ...opts.tlsCreds, keepAlive: true });
        } else {
            this._reqOpts.agent = opts.tokenEndpoint?.startsWith('http:')
                ? new http.Agent()
                : new https.Agent();
        }

        if (opts.tokenEndpoint && opts.clientKey && opts.clientSecret) {
            this._basicToken = Buffer.from(`${opts.clientKey}:${opts.clientSecret}`).toString('base64');
            this._reqOpts.uri = opts.tokenEndpoint;
        } else if (opts.staticToken) {
            this._logger.isDebugEnabled && this._logger.debug('WSO2 auth config token API data not set, fallback to static token');
            this._token = opts.staticToken;
        } else {
            // throw new Error('WSO2 auth error: neither token API data nor static token is set');
            this._token = null;
        }
    }

    getToken() {
        return this._token;
    }

    async start() {
        if (this._token === undefined) {
            await this.refreshToken();
        }
    }

    stop() {
        clearTimeout(this._refreshTimer);
        this._refreshTimer = null;
        this._token = null;
        this._stop = true;
    }

    async refreshToken() {
        // Prevent the timeout from expiring and triggering an extraneous refresh
        this.stop();
        this._stop = false;

        this._logger.isDebugEnabled && this._logger.debug('WSO2 token refresh initiated');
        const reqOpts = {
            ...this._reqOpts,
            headers: {
                'Authorization': `Basic ${this._basicToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        };
        let refreshSeconds;
        try {
            const response = await this._requester.sendRequest(reqOpts).catch(err => err);
            this._logger.isVerboseEnabled && this._logger.verbose('Response received from WSO2');
            if (response.status > 299) {
                this.emit('error', 'Error retrieving WSO2 auth token');
                throw new Error(`Unexpected response code ${response.status} received from WSO2 token request`);
            }
            const { access_token, expires_in } = response.data;
            this._token = access_token;
            const tokenIsValidNumber = (typeof expires_in === 'number') && (expires_in > 0);
            const tokenExpiry = tokenIsValidNumber ? expires_in : Infinity;
            refreshSeconds = Math.min(this._refreshSeconds, tokenExpiry);
            this._logger.isDebugEnabled && this._logger.debug('WSO2 token refreshed successfully. ' +
                `Token expiry is ${expires_in}${tokenIsValidNumber ? 's' : ''}, ` +
                `next refresh in ${refreshSeconds}s`);
        } catch (error) {
            this._logger.isErrorEnabled && this._logger.error(`Error performing WSO2 token refresh: ${error.message}. `
                + `Retry in ${this._refreshRetrySeconds}s`);
            refreshSeconds = this._refreshRetrySeconds;
        }
        if (!this._stop) { // Don't schedule the next refresh if stop() was called meanwhile
            this._refreshTimer = setTimeout(this.refreshToken.bind(this), refreshSeconds * 1000);
        }
        return this.getToken();
    }
}

module.exports = WSO2Auth;

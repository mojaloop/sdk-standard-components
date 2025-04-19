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

 * Eugen Klymniuk <eugen.klymniuk@infitx.com>
 --------------
 **********/

/**
 * @typedef {Object} HttpOptions
 * @prop {string} uri - URI of request to send to.
 * @prop {string} method - HTTP method of the request.
 * @prop {Object} headers - Headers of the request.
 * @prop {Object | null} [qs=null] - The request URL query strings.
 * @prop {Object | null} [body=null] - Payload of the request.
 * @prop {('arraybuffer' | 'json' | 'text' | 'stream')} [responseType='json'] - responseType of the request.
 * @prop {http.Agent} [agent] - HTTP agent, used to send the request.
 * @prop {number} [timeout] - Number of milliseconds before the request times out.
 * @prop {axios.AxiosRequestConfig} [httpConfig] - axios configs to be able to override default axios options per one request
 */

const { loggerFactory } = require('../logger');
const defaultConfig = require('./defaultConfig');
const AxiosHttpRequester = require('./AxiosHttpRequester');

const defaultLogger = loggerFactory({ context: 'SDK_SC', component: 'HttpRequester' });

const createHttpRequester = ({
    logger = defaultLogger,
    httpClient = null,
    httpConfig = defaultConfig.createDefaultHttpConfig(),
    retryConfig = defaultConfig.createDefaultRetryConfig(logger),
} = {}) => {
    const deps = {
        logger,
        ...(httpClient ? { httpClient } : { httpConfig, retryConfig })
    };
    return new AxiosHttpRequester(deps);
};

const httpRequester = createHttpRequester();

/**
 * Backwards compatibility http request functionality
 * @deprecated  Use createHttpRequester instead
 * @param {HttpOptions} reqOpts - HTTP request options
 * @returns {Promise<unknown>} HTTP response
 */
const request = (reqOpts) => httpRequester.sendRequest(reqOpts);
request.responseType = httpRequester.responseType;

module.exports = {
    request, // use createHttpRequester instead
    createHttpRequester,
    defaultConfig,
};

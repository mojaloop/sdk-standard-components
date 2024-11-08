/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

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
 * @prop {http.Agent} agent - HTTP agent, used to send the request.
 */

const { Logger } = require('../logger');
const AxiosHttpRequester = require('./AxiosHttpRequester');
const defaultHttpConfig = require('./defaultHttpConfig');

const createHttpRequester = ({
    logger = new Logger(),
    httpConfig = defaultHttpConfig,
    httpClient = null
} = {}) => {
    const deps = {
        logger,
        ...(httpClient ? { httpClient } : { httpConfig })
    };
    return new AxiosHttpRequester(deps);
};

const httpRequester = createHttpRequester();

/**
 * Backwards compatibility http request functionality
 * @param {HttpOptions} reqOpts - HTTP request options
 * @returns {Promise<unknown>} HTTP response
 */
const request = (reqOpts) => httpRequester.sendRequest(reqOpts);
request.responseType = httpRequester.responseType;

module.exports = {
    request,
    createHttpRequester,
    defaultHttpConfig,
};

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
 * Eugen Klymniuk <eugen.klymniuk@infitx.com>

 --------------
 ******/

const { RESOURCES } = require('../constants');
const { formatEndpointOrDefault } = require('./common');
const BaseRequests = require('./baseRequests');

const PING = RESOURCES.ping;

/**
 * @typedef {Object} PutPingParams
 * @prop {string} requestId - The ID of the ping request
 * @prop {string} destination - The ID of the destination participant
 * @prop {Object.<string, string>} headers - Headers for the request
 * @prop {MojaloopApiErrorObject} [errInfo] - Payload for error callback
 */

class PingRequests extends BaseRequests {
    defineResourceVersionsAndEndpoints(config) {
        this.resourceVersions = {
            [PING]: {
                contentVersion: '2.0',
                acceptVersion: '2',
            },
            parties: {
                contentVersion: '1.0',
                acceptVersion: '1',
            },
        };
        this.resourceEndpoints = {
            [PING]: formatEndpointOrDefault(config.pingEndpoint, this.transportScheme, this.peerEndpoint),
            parties: formatEndpointOrDefault(config.alsEndpoint, this.transportScheme, this.peerEndpoint),
        };
    }

    /**
     *  Executes `PUT /ping/{requestId}` request
     * @param {PutPingParams} params
     * @returns {Promise<GenericRequestResponse | GenericRequestResponseUndefined>}}
     */
    async putPing({ requestId, destination, headers }) {
        const url = `${PING}/${requestId}/`;
        const body = { requestId };
        return this._put(url, PING, body, destination, headers);
    }

    /**
     *  Executes `PUT /ping/{requestId}/error` request
     * @param {PutPingParams} params
     * @returns {Promise<GenericRequestResponse | GenericRequestResponseUndefined>}
     */
    async putPingError({ requestId, destination, headers, errInfo }) {
        const url = `${PING}/${requestId}/error`;
        return this._put(url, PING, errInfo, destination, headers);
    }

    // TODO: just for testing!!!  Need to be removed
    async putParties() {
        const url = 'parties/MSISDN/1234';
        return this._put(url, 'parties', {}, 'destFspId', {})
            .catch(err => { this.logger.warn('error in ping putParties: ', err); });
    }
}

module.exports = PingRequests;

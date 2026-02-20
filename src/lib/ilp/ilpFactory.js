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

const { ILP_VERSIONS, ERROR_MESSAGES } = require('../constants');
const IlpV1 = require('./IlpV1');
const IlpV4 = require('./IlpV4');

const ilpFactory = (version, options) => {
    if (!options?.secret || !options?.logger) throw new Error(ERROR_MESSAGES.invalidIlpOptions);

    options.logger.isDebugEnabled && options.logger.debug(`ilpFactory - creating ILP ${version}...`);

    if (version === ILP_VERSIONS.v1) return new IlpV1(options);
    if (version === ILP_VERSIONS.v4) return new IlpV4(options);

    throw new Error(ERROR_MESSAGES.unsupportedIlpVersion);
};

module.exports = ilpFactory;

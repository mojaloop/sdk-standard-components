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

const { env } = require('node:process');

const ResponseType = Object.freeze({
    ArrayBuffer: 'arraybuffer',
    JSON: 'json',
    Text: 'text',
    Stream: 'stream'
    // Document: 'document', // this available in axios
});

const DEFAULT_TIMEOUT = env.HTTP_DEFAULT_TIMEOUT ? parseInt(env.HTTP_DEFAULT_TIMEOUT, 10) : 65_000; // there's lots of callback/request timeouts in TTK with 60_000 ms
const DEFAULT_RETRIES = env.HTTP_DEFAULT_RETRIES ? parseInt(env.HTTP_DEFAULT_RETRIES, 10) : 3;
const DEFAULT_RETRY_DELAY = env.HTTP_DEFAULT_RETRY_DELAY ? parseInt(env.HTTP_DEFAULT_RETRY_DELAY, 10) : 10; // in ms

module.exports = {
    ResponseType,
    DEFAULT_TIMEOUT,
    DEFAULT_RETRIES,
    DEFAULT_RETRY_DELAY
};

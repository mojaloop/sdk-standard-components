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

const cleanupIncomingHeaders = (headers, incomingHeadersRemoval = []) => {
    const cleanedHeaders = { ...headers };
    // prettier-ignore
    [
        ...sensitiveHeaders,
        ...hopByHopHeaders,
        ...xHeaders,
        ...incomingHeadersRemoval
    ].forEach((header) => {
        delete cleanedHeaders[header];
    });

    return cleanedHeaders;
};

const sensitiveHeaders = [
    'authorization',
    'cookie',
    'set-cookie',
    'host', // without removing host header request proxy fails with error: "Client network socket disconnected before secure TLS connection was established"
    'content-length', // without removing content-length header request just stuck
    'accept-encoding',
    'user-agent',
];

const hopByHopHeaders = [
    'connection',
    'proxy-connection',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'keep-alive',
];

const xHeaders = [
    'x-forwarded-proto',
    'x-request-id',
    'x-envoy-attempt-count',
    'x-forwarded-for',
    'x-forwarded-client-cert',
    'x-envoy-external-address',
    'x-envoy-decorator-operation',
    'x-envoy-peer-metadata',
    'x-envoy-peer-metadata-id',
    'x-b3-traceid',
    'x-b3-spanid',
    'x-b3-parentspanid',
    'x-b3-sampled',
];


module.exports = {
    cleanupIncomingHeaders
};

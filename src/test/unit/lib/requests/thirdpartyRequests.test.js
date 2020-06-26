/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the 'License') and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
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

 * Crosslake
 - Lewis Daly <lewisd@crosslaketech.com>

 --------------
 ******/


const fs = require('fs');
jest.mock('http');
jest.mock('stream');
const http = require('http');

const ThirdpartyRequests = require('../../../../lib/requests/thirdPartyRequests.js');
const WSO2Auth = require('../../../../lib/WSO2Auth');

const jwsSigningKey = fs.readFileSync(__dirname + '/../../data/jwsSigningKey.pem');


describe.skip('ThirdpartyRequests', () => {
    describe('postAuthorizations', () => {
        const wso2Auth = new WSO2Auth({ logger: { log: () => { } }});
        const config = {
            // Disable logging in tests
            // logger: { log: () => { } },
            logger: console,
            peerEndpoint: '127.0.0.1',
            tls: {
                outbound: {
                    mutualTLS: {
                        enabled: false
                    }
                }
            },
            jwsSign: false,
            jwsSignPutParties: false,
            jwsSigningKey: jwsSigningKey,
            wso2Auth,
        };

        it('executes a `POST /authorizations` request', async () => {
            // Arrange
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);

            const authBody = {
                transactionRequestId: '123',
                authenticationType: 'U2F',
                retriesLeft: '1',
                amount: {
                    amount: '100',
                    currency: 'U2F',
                },
                transactionId: '987'
            };

            // Act
            await tpr.postAuthorizations(authBody, 'pispa');

            // Assert
            // TODO: get the instance that we use somewhere.. and check the mocks
            console.log('result', http.__request.mock.calls[0]);
            // expect(http.__request.mock.calls[0][0].headers['fspiop-destination']).toBe('pispa');
            // expect(http.__request.mock.calls[0][0].path).toBe('/authorizations');
            //         reqOpts.headers['content-length'] = Buffer.byteLength(opts.body);
        });
    });
});

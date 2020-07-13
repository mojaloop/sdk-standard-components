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
const http = require('http');

const ThirdpartyRequests = require('../../../../lib/requests/thirdpartyRequests');
const WSO2Auth = require('../../../../lib/WSO2Auth');
const mockLogger = require('../../../__mocks__/mockLogger');

const jwsSigningKey = fs.readFileSync(__dirname + '/../../data/jwsSigningKey.pem');


describe('ThirdpartyRequests', () => {
    describe('putConsents', () => {
        const putConsentsRequest = require('../../data/putConsentsRequest.json');
        // const transferRequest = require('../../data/thirdpartyRequestsTransaction.json');
        const wso2Auth = new WSO2Auth({ logger: mockLogger({ app: 'get-thirdparty-request-transaction-test' }) });
        const config = {
            logger: mockLogger({ app: 'getThirdpartyRequestsTransaction-test' }),
            peerEndpoint: '127.0.0.1',
            thirdpartyRequestsEndpoint: 'thirdparty-api-adapter.local',
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

        it('executes a `POST /thirdpartyRequests/transactions` request', async () => {
            // Arrange
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const consentId = '123';
            const consentBody = putConsentsRequest;
            const expected = expect.objectContaining({
                host: 'thirdparty-api-adapter.local',
                method: 'PUT',
                path: '/consents/123',
                headers: expect.objectContaining({
                    'fspiop-destination': 'dfspa'
                })
            });

            // Act
            await tpr.putConsents(consentId, consentBody, 'dfspa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(consentBody)));
            expect(http.__request).toHaveBeenCalledWith(expected);
        });
    });

    describe('postAuthorizations', () => {
        const wso2Auth = new WSO2Auth({ logger: mockLogger({app: 'post-authorizations-test'})});
        const config = {
            logger: mockLogger({ app: 'postAuthorizations-test' }),
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
            expect(http.__write.mock.calls[0][0]).toStrictEqual(JSON.stringify(authBody));
            expect(http.__request.mock.calls[0][0].headers['fspiop-destination']).toBe('pispa');
            expect(http.__request.mock.calls[0][0].path).toBe('/authorizations');
        });
    });

    describe('getThirdpartyRequestsTransactions', () => {
        const wso2Auth = new WSO2Auth({ logger: mockLogger({app: 'get-thirdparty-request-transaction-test'})});
        const config = {
            logger: mockLogger({ app: 'getthirdpartyRequestsTransaction-test' }),
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

        it('executes a `GET /thirdpartyRequests/transactions/{ID}` request', async () => {
            // Arrange
            http.__request.mockClear();
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const transactionRequestId = 1;

            // Act
            await tpr.getThirdpartyRequestsTransactions(transactionRequestId, 'dfspa');

            // Assert
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'path': '/thirdpartyRequests/transactions/1',
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'dfspa'
                    })
                })
            );
        });
    });

    describe('postThirdpartyRequestsTransactions', () => {
        const transferRequest = require('../../data/thirdpartyRequestsTransaction.json');
        const wso2Auth = new WSO2Auth({ logger: mockLogger({app: 'get-thirdparty-request-transaction-test'})});
        const config = {
            logger: mockLogger({ app: 'getThirdpartyRequestsTransaction-test' }),
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

        it('executes a `POST /thirdpartyRequests/transactions` request', async () => {
            // Arrange
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const requestBody = transferRequest;

            // Act
            await tpr.postThirdpartyRequestsTransactions(requestBody, 'dfspa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(requestBody)));
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'path': '/thirdpartyRequests/transactions',
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'dfspa'
                    })
                })
            );
        });
    });
});

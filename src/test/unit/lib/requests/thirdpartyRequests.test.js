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
        const wso2Auth = new WSO2Auth({ logger: mockLogger({ app: 'put-consents-test' }) });
        const config = {
            logger: mockLogger({ app: 'put-consents-test' }),
            peerEndpoint: '127.0.0.1',
            thirdpartyRequestsEndpoint: 'thirdparty-api-adapter.local',
            tls: {
                mutualTLS: {
                    enabled: false
                }
            },
            jwsSign: false,
            jwsSignPutParties: false,
            jwsSigningKey: jwsSigningKey,
            wso2Auth,
        };

        it('executes a `PUT /consents/{id}` request', async () => {
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

    describe('patchConsents', () => {
        const patchConsentsRequest = require('../../data/patchConsentsRequest.json');
        const wso2Auth = new WSO2Auth({ logger: mockLogger({ app: 'patch-consents-test' }) });
        const config = {
            logger: mockLogger({ app: 'patch-consents-test' }),
            peerEndpoint: '127.0.0.1',
            thirdpartyRequestsEndpoint: 'thirdparty-api-adapter.local',
            tls: {
                mutualTLS: {
                    enabled: false
                }
            },
            jwsSign: false,
            jwsSignPutParties: false,
            jwsSigningKey: jwsSigningKey,
            wso2Auth,
        };
        const config2 = {
            logger: mockLogger({ app: 'patch-consents-test' }),
            peerEndpoint: '127.0.0.1',
            thirdpartyRequestsEndpoint: 'thirdparty-api-adapter.local',
            tls: {
                mutualTLS: {
                    enabled: false
                }
            },
            jwsSign: true,
            jwsSignPutParties: false,
            jwsSigningKey: jwsSigningKey,
            wso2Auth,
        };
        http.__request = jest.fn(() => ({
            statusCode: 202,
            headers: {
                'content-length': 0
            },
        }));
        const consentId = '123';
        const expected = expect.objectContaining({
            host: 'thirdparty-api-adapter.local',
            method: 'PATCH',
            path: '/consents/123',
            headers: expect.objectContaining({
                'fspiop-destination': 'dfspa'
            })
        });

        it('executes a `PATCH /consents/{id}` request', async () => {
            // Init
            const tpr = new ThirdpartyRequests(config);


            // Act
            await tpr.patchConsents(consentId, patchConsentsRequest, 'dfspa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(patchConsentsRequest)));
            expect(http.__request).toHaveBeenCalledWith(expected);
        });

        it('executes a `PATCH /consents/{id}` request with signing enabled', async () => {
            // Init
            const tpr = new ThirdpartyRequests(config2);

            // Act
            await tpr.patchConsents(consentId, patchConsentsRequest, 'dfspa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(patchConsentsRequest)));
            expect(http.__request).toHaveBeenCalledWith(expected);
        });
    });

    describe('postConsents', () => {
        const postConsentsRequest = require('../../data/postConsentsRequest.json');
        const wso2Auth = new WSO2Auth({ logger: mockLogger({ app: 'post-consents-test' }) });
        const config = {
            logger: mockLogger({ app: 'post-consents-test' }),
            peerEndpoint: '127.0.0.1',
            thirdpartyRequestsEndpoint: 'thirdparty-api-adapter.local',
            tls: {
                mutualTLS: {
                    enabled: false
                }
            },
            jwsSign: false,
            jwsSignPutParties: false,
            jwsSigningKey: jwsSigningKey,
            wso2Auth,
        };

        it('executes a `POST /consents` request', async () => {
            // Arrange
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const consentBody = postConsentsRequest;
            const expected = expect.objectContaining({
                host: 'thirdparty-api-adapter.local',
                method: 'POST',
                path: '/consents',
                headers: expect.objectContaining({
                    'fspiop-destination': 'dfspa'
                })
            });

            // Act
            await tpr.postConsents(consentBody, 'dfspa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(consentBody)));
            expect(http.__request).toHaveBeenCalledWith(expected);
        });
    });

    describe('putConsentRequests', () => {
        const putConsentRequestsRequests = require('../../data/putConsentRequestsRequest.json');
        const wso2Auth = new WSO2Auth({ logger: mockLogger({ app: 'put-consent-requests-test' }) });
        const config = {
            logger: mockLogger({ app: 'put-consent-requests-test' }),
            peerEndpoint: '127.0.0.1',
            thirdpartyRequestsEndpoint: 'thirdparty-api-adapter.local',
            tls: {
                mutualTLS: {
                    enabled: false
                }
            },
            jwsSign: false,
            jwsSignPutParties: false,
            jwsSigningKey: jwsSigningKey,
            wso2Auth,
        };

        it('executes a `POST /consentRequests/{ID}` request', async () => {
            // Arrange
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const consentRequestsBody = putConsentRequestsRequests;
            const consentRequestsId = '123';
            const expected = expect.objectContaining({
                host: 'thirdparty-api-adapter.local',
                method: 'PUT',
                path: '/consentRequests/123',
                headers: expect.objectContaining({
                    'fspiop-destination': 'dfspa'
                })
            });

            // Act
            await tpr.putConsentRequests(consentRequestsId, consentRequestsBody, 'dfspa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(consentRequestsBody)));
            expect(http.__request).toHaveBeenCalledWith(expected);
        });
    });

    describe('postConsentRequests', () => {
        const postConsentRequestsRequest = require('../../data/postConsentRequestsRequest.json');
        const wso2Auth = new WSO2Auth({ logger: mockLogger({ app: 'post-consent-requests-test' }) });
        const config = {
            logger: mockLogger({ app: 'post-consent-requests-test' }),
            peerEndpoint: '127.0.0.1',
            thirdpartyRequestsEndpoint: 'thirdparty-api-adapter.local',
            tls: {
                mutualTLS: {
                    enabled: false
                }
            },
            jwsSign: false,
            jwsSignPutParties: false,
            jwsSigningKey: jwsSigningKey,
            wso2Auth,
        };

        it('executes a `POST /consentRequests` request', async () => {
            // Arrange
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const consentRequestBody = postConsentRequestsRequest;
            const expected = expect.objectContaining({
                host: 'thirdparty-api-adapter.local',
                method: 'POST',
                path: '/consentRequests',
                headers: expect.objectContaining({
                    'fspiop-destination': 'dfspa'
                })
            });

            // Act
            await tpr.postConsentRequests(consentRequestBody, 'dfspa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(consentRequestBody)));
            expect(http.__request).toHaveBeenCalledWith(expected);
        });
    });

    describe('postAuthorizations', () => {
        const wso2Auth = new WSO2Auth({ logger: mockLogger({app: 'post-authorizations-test'})});
        const config = {
            logger: mockLogger({ app: 'postAuthorizations-test' }),
            peerEndpoint: '127.0.0.1',
            tls: {
                mutualTLS: {
                    enabled: false
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
                mutualTLS: {
                    enabled: false
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
                    'method': 'GET',
                    'path': '/thirdpartyRequests/transactions/1',
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'dfspa'
                    })
                })
            );
        });
    });

    describe('postThirdpartyRequestsTransactions', () => {
        const postTransactionRequest = require('../../data/postThirdpartyRequestsTransaction.json');
        const postTransactionRequestAuthorization = require('../../data/postThirdpartyRequestsTransactionAuthorization.json');
        const wso2Auth = new WSO2Auth({ logger: mockLogger({app: 'post-thirdparty-request-transaction-test'})});
        const config = {
            logger: mockLogger({ app: 'postThirdpartyRequestsTransaction-test' }),
            peerEndpoint: '127.0.0.1',
            tls: {
                mutualTLS: {
                    enabled: false
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
            const requestBody = postTransactionRequest;

            // Act
            await tpr.postThirdpartyRequestsTransactions(requestBody, 'dfspa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(requestBody)));
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'method': 'POST',
                    'path': '/thirdpartyRequests/transactions',
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'dfspa'
                    })
                })
            );
        });

        it('executes a `POST /thirdpartyRequests/transactions/{ID}/authorizations` request', async () => {
            // Arrange
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const requestBody = postTransactionRequestAuthorization;
            const transactionRequestId = 1;

            // Act
            await tpr.postThirdpartyRequestsTransactionsAuthorizations(requestBody, transactionRequestId, 'dfspa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(requestBody)));
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'method': 'POST',
                    'path': '/thirdpartyRequests/transactions/1/authorizations',
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'dfspa'
                    })
                })
            );
        });
    });

    describe('putThirdpartyRequestsTransactions', () => {
        const putSuccessRequest = require('../../data/putThirdpartyRequestTransaction.json');
        const putErrorRequest = require('../../data/putThirdpartyRequestTransactionError.json');
        const wso2Auth = new WSO2Auth({ logger: mockLogger({app: 'put-thirdparty-request-transaction-test'})});
        const config = {
            logger: mockLogger({ app: 'putThirdpartyRequestsTransaction-test' }),
            peerEndpoint: '127.0.0.1',
            tls: {
                mutualTLS: {
                    enabled: false
                }
            },
            jwsSign: false,
            jwsSignPutParties: false,
            jwsSigningKey: jwsSigningKey,
            wso2Auth,
        };

        it('executes a `PUT /thirdpartyRequests/transactions/{ID}` request', async () => {
            // Arrange
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const requestBody = putSuccessRequest;
            const transactionRequestId = 1;

            // Act
            await tpr.putThirdpartyRequestsTransactions(requestBody, transactionRequestId, 'pispa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(requestBody)));
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'method': 'PUT',
                    'path': '/thirdpartyRequests/transactions/1',
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'pispa'
                    })
                })
            );
        });

        it('executes a `PUT /thirdpartyRequests/transactions/{ID}/error` request', async () => {
            // Arrange
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const requestBody = putErrorRequest;
            const transactionRequestId = 1;

            // Act
            await tpr.putThirdpartyRequestsTransactionsError(requestBody, transactionRequestId, 'pispa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(requestBody)));
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'method': 'PUT',
                    'path': '/thirdpartyRequests/transactions/1/error',
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'pispa'
                    })
                })
            );
        });
    });


    describe('putThirdpartyRequestsTransactionsAuthorizations', () => {
        const putTransactionsAuthorizationsRequest = require('../../data/putThirdpartyRequestsTransactionAuthorization.json');
        const putErrorRequest = require('../../data/putThirdpartyRequestTransactionAuthorizationsError.json');
        const wso2Auth = new WSO2Auth({ logger: mockLogger({app: 'get-thirdparty-request-transaction-authorization-test'})});
        const config = {
            logger: mockLogger({ app: 'putThirdpartyRequestsTransactionAuthorization-test' }),
            peerEndpoint: '127.0.0.1',
            tls: {
                mutualTLS: {
                    enabled: false
                }
            },
            jwsSign: false,
            jwsSignPutParties: false,
            jwsSigningKey: jwsSigningKey,
            wso2Auth,
        };
        it('executes a `PUT /thirdpartyRequests/transactions/{ID}/authorizations` request', async () => {
            // Arrange
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const requestBody = putTransactionsAuthorizationsRequest;
            const transactionRequestId = 1;

            // Act
            await tpr.putThirdpartyRequestsTransactionsAuthorizations(requestBody, transactionRequestId, 'dfspa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(requestBody)));
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'method': 'PUT',
                    'path': '/thirdpartyRequests/transactions/1/authorizations',
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'dfspa'
                    })
                })
            );
        });

        it('executes a `PUT /thirdpartyRequests/transactions/{ID}/authorizations/error` request', async () => {
            // Arrange
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const requestBody = putErrorRequest;
            const transactionRequestId = 1;

            // Act
            await tpr.putThirdpartyRequestsTransactionsAuthorizationsError(requestBody, transactionRequestId, 'pispa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(requestBody)));
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'method': 'PUT',
                    'path': '/thirdpartyRequests/transactions/1/authorizations/error',
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'pispa'
                    })
                })
            );
        });
    });
});

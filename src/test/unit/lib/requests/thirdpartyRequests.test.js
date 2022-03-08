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

    describe('patchConsentRequests', () => {
        const patchConsentRequestsRequests = require('../../data/patchConsentRequestsRequest.json');
        const wso2Auth = new WSO2Auth({ logger: mockLogger({ app: 'patch-consent-requests-test' }) });
        const config = {
            logger: mockLogger({ app: 'patch-consent-requests-test' }),
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

        it('executes a `PATCH /consentRequests/{ID}` request', async () => {
            // Arrange
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const consentRequestsBody = patchConsentRequestsRequests;
            const consentRequestsId = '123';
            const expected = expect.objectContaining({
                host: 'thirdparty-api-adapter.local',
                method: 'PATCH',
                path: '/consentRequests/123',
                headers: expect.objectContaining({
                    'fspiop-destination': 'dfspa'
                })
            });

            // Act
            await tpr.patchConsentRequests(consentRequestsId, consentRequestsBody, 'dfspa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(consentRequestsBody)));
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

        it('executes a `PUT /consentRequests/{ID}` request', async () => {
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

    describe('putConsentRequestsRequestError', () => {
        const putConsentRequestsRequestError = require('../../data/putConsentRequestsRequestError.json');
        const wso2Auth = new WSO2Auth({ logger: mockLogger({ app: 'put-consent-requests-error-test' }) });
        const config = {
            logger: mockLogger({ app: 'put-consent-requests-error-test' }),
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

        it('executes a `PUT /consentRequests/{ID}/error` request', async () => {
            http.__request.mockClear();
            // Arrange
            http.__request = jest.fn(() => ({
                statusCode: 200,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const requestBody = putConsentRequestsRequestError;
            const consentRequestId = '12345';
            // Act
            await tpr.putConsentRequestsError(consentRequestId, requestBody, 'pispa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(requestBody)));
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'method': 'PUT',
                    'path': '/consentRequests/12345/error',
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'pispa'
                    })
                })
            );
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

    describe('patchThirdpartyRequestsTransactions', () => {
        const patchSuccessRequest = require('../../data/patchThirdpartyRequestTransaction.json');
        const wso2Auth = new WSO2Auth({ logger: mockLogger({app: 'patch-thirdparty-request-transaction-test'})});
        const config = {
            logger: mockLogger({ app: 'patchThirdpartyRequestsTransaction-test' }),
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

        it('executes a `PATCH /thirdpartyRequests/transactions/{ID}` request', async () => {
            // Arrange
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const requestBody = patchSuccessRequest;
            const transactionRequestId = 1;

            // Act
            await tpr.patchThirdpartyRequestsTransactions(requestBody, transactionRequestId, 'pispa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(requestBody)));
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'method': 'PATCH',
                    'path': '/thirdpartyRequests/transactions/1',
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'pispa'
                    })
                })
            );
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

    describe('*ThirdpartyRequestsAuthorizations', () => {
        const postThirdpartyRequestsAuthorizationBody = require('../../data/postThirdpartyRequestsAuthorizationBody.json');
        const putThirdpartyRequestsAuthorizationBody = require('../../data/putThirdpartyRequestsAuthorizationBody.json');
        const putThirdpartyRequestsAuthorizationErrorBody = require('../../data/putThirdpartyRequestsAuthorizationErrorBody.json');
        const wso2Auth = new WSO2Auth({ logger: mockLogger({ app: '*ThirdpartyRequestsAuthorizations-test' }) });

        const config = {
            logger: mockLogger({ app: '*ThirdpartyRequestsAuthorizations-test' }),
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

        it('executes a POST /thirdpartyRequests/authorizations call', async () => {
            // Arrange
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);

            // Act
            await tpr.postThirdpartyRequestsAuthorizations(postThirdpartyRequestsAuthorizationBody, 'dfspa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(postThirdpartyRequestsAuthorizationBody)));
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'method': 'POST',
                    'path': '/thirdpartyRequests/authorizations',
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'dfspa'
                    })
                })
            );
        });

        it('executes a PUT /thirdpartyRequests/authorizations/{ID} call', async () => {
            // Arrange
            http.__request = jest.fn(() => ({
                statusCode: 200,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const authorizationRequestId = 1;

            // Act
            await tpr.putThirdpartyRequestsAuthorizations(putThirdpartyRequestsAuthorizationBody, authorizationRequestId, 'dfspa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(putThirdpartyRequestsAuthorizationBody)));
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'method': 'PUT',
                    'path': '/thirdpartyRequests/authorizations/1',
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'dfspa'
                    })
                })
            );
        });

        it('executes a PUT /thirdpartyRequests/authorizations/{ID}/error call', async () => {
            // Arrange
            http.__request = jest.fn(() => ({
                statusCode: 200,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const authorizationRequestId = 1;

            // Act
            await tpr.putThirdpartyRequestsAuthorizationsError(putThirdpartyRequestsAuthorizationErrorBody, authorizationRequestId, 'dfspa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(putThirdpartyRequestsAuthorizationErrorBody)));
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'method': 'PUT',
                    'path': '/thirdpartyRequests/authorizations/1/error',
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'dfspa'
                    })
                })
            );
        });


    });

    describe('accountRequests', () => {
        const putAccountsRequest = require('../../data/putAccountsByUserIdRequest.json');
        const putErrorRequest = require('../../data/putAccountsByRequestError.json');
        const wso2Auth = new WSO2Auth({ logger: mockLogger({ app: 'accounts-requests-test' }) });
        const config = {
            logger: mockLogger({ app: 'accounts-requests-test' }),
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

        it('executes a `GET /accounts/{ID}` request', async () => {
            // Arrange
            http.__request.mockClear();
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const userId = 'username1234';

            // Act
            await tpr.getAccounts(userId, 'dfspa');

            // Assert
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'method': 'GET',
                    'path': '/accounts/username1234',
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'dfspa'
                    })
                })
            );
        });

        it('executes a `PUT /accounts/{ID}` request', async () => {
            // Arrange
            http.__request.mockClear();
            http.__request = jest.fn(() => ({
                statusCode: 200,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const requestBody = putAccountsRequest;
            const userId = 'username1234';

            // Act
            await tpr.putAccounts(userId, requestBody, 'pispa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(requestBody)));
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'method': 'PUT',
                    'path': '/accounts/username1234',
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'pispa'
                    })
                })
            );
        });

        it('executes a `PUT /accounts/{ID}/error` request', async () => {
            http.__request.mockClear();
            // Arrange
            http.__request = jest.fn(() => ({
                statusCode: 200,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const requestBody = putErrorRequest;
            const userId = 'username1234';

            // Act
            await tpr.putAccountsError(userId, requestBody, 'pispa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(requestBody)));
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'method': 'PUT',
                    'path': '/accounts/username1234/error',
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'pispa'
                    })
                })
            );
        });
    });

    describe('/verifications requests', () => {
        const postThirdpartyRequestsVerifications = require('../../data/postThirdpartyRequestsVerifications.json');
        const putThirdpartyRequestsVerificationsId = require('../../data/putThirdpartyRequestsVerificationsId.json');
        const putThirdpartyRequestsVerificationsIdError = require('../../data/putThirdpartyRequestsVerificationsIdError.json');
        const wso2Auth = new WSO2Auth({ logger: mockLogger({ app: 'accounts-requests-test' }) });
        const config = {
            logger: mockLogger({ app: 'accounts-requests-test' }),
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


        it('executes a `POST /thirdpartyRequests/verifications` request', async () => {
            // Arrange
            http.__request.mockClear();
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const requestBody = postThirdpartyRequestsVerifications;

            // Act
            await tpr.postThirdpartyRequestsVerifications(requestBody, 'pispa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(requestBody)));
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'method': 'POST',
                    'path': '/thirdpartyRequests/verifications',
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'pispa'
                    })
                })
            );
        });

        it('executes a `PUT /thirdpartyRequests/verifications/{ID}` request', async () => {
            // Arrange
            http.__request.mockClear();
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const requestBody = putThirdpartyRequestsVerificationsId;
            const verificationRequestId = '282352f3-ed76-4a66-91c4-705947060c7e';

            // Act
            await tpr.putThirdpartyRequestsVerifications(requestBody, verificationRequestId, 'pispa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(requestBody)));
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'method': 'PUT',
                    'path': `/thirdpartyRequests/verifications/${verificationRequestId}`,
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'pispa'
                    })
                })
            );
        });

        it('executes a `PUT /thirdpartyRequests/verifications/{ID}/error` request', async () => {
            // Arrange
            http.__request.mockClear();
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const requestBody = putThirdpartyRequestsVerificationsIdError;
            const verificationRequestId = '282352f3-ed76-4a66-91c4-705947060c7e';

            // Act
            await tpr.putThirdpartyRequestsVerificationsError(requestBody, verificationRequestId, 'pispa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(requestBody)));
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'method': 'PUT',
                    'path': `/thirdpartyRequests/verifications/${verificationRequestId}/error`,
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'pispa'
                    })
                })
            );
        });
    });


    describe('servicesRequests', () => {
        const putServicesRequest = require('../../data/putServicesByServiceTypeRequest.json');
        const putErrorRequest = require('../../data/putServicesByServiceTypeRequestError.json');
        const wso2Auth = new WSO2Auth({ logger: mockLogger({ app: 'services-requests-test' }) });
        const config = {
            logger: mockLogger({ app: 'services-requests-test' }),
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
            servicesEndpoint: '127.0.0.2',
        };

        it('resolves to service endpoint', async () => {
            // Arrange
            http.__request.mockClear();
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const serviceType = 'THIRD_PARTY_DFSP';

            // Act
            await tpr.getServices(serviceType);

            // Assert
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'host': '127.0.0.2'
                })
            );
        });

        it('executes a `GET /services/{ServiceType}` request', async () => {
            // Arrange
            http.__request.mockClear();
            http.__request = jest.fn(() => ({
                statusCode: 202,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const serviceType = 'THIRD_PARTY_DFSP';

            // Act
            await tpr.getServices(serviceType);

            // Assert
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'method': 'GET',
                    'path': '/services/THIRD_PARTY_DFSP'
                })
            );
        });

        it('executes a `PUT /services/{ServiceType}` request', async () => {
            // Arrange
            http.__request.mockClear();
            http.__request = jest.fn(() => ({
                statusCode: 200,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const requestBody = putServicesRequest;
            const serviceType = 'THIRD_PARTY_DFSP';

            // Act
            await tpr.putServices(serviceType, requestBody, 'pispa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(requestBody)));
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'method': 'PUT',
                    'path': '/services/THIRD_PARTY_DFSP',
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'pispa'
                    })
                })
            );
        });

        it('executes a `PUT /services/{ID}/error` request', async () => {
            http.__request.mockClear();
            // Arrange
            http.__request = jest.fn(() => ({
                statusCode: 200,
                headers: {
                    'content-length': 0
                },
            }));
            const tpr = new ThirdpartyRequests(config);
            const requestBody = putErrorRequest;
            const serviceType = 'THIRD_PARTY_DFSP';

            // Act
            await tpr.putServicesError(serviceType, requestBody, 'pispa');

            // Assert
            expect(http.__write).toHaveBeenCalledWith((JSON.stringify(requestBody)));
            expect(http.__request).toHaveBeenCalledWith(
                expect.objectContaining({
                    'method': 'PUT',
                    'path': '/services/THIRD_PARTY_DFSP/error',
                    'headers': expect.objectContaining({
                        'fspiop-destination': 'pispa'
                    })
                })
            );
        });
    });
});

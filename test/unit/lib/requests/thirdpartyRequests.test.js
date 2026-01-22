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

 * Crosslake
 - Lewis Daly <lewisd@crosslaketech.com>

 --------------
 ******/

const { mockAxios, jsonContentTypeHeader } = require('#test/unit/utils');
const ThirdpartyRequests = require('../../../../src/lib/requests/thirdpartyRequests');
const { mockConfigDto } = require('../../../fixtures');

const putConsentsRequest = require('../../data/putConsentsRequest.json');
const postConsentsRequest = require('../../data/postConsentsRequest.json');
const patchConsentsRequest = require('../../data/patchConsentsRequest.json');
const patchConsentRequestsRequests = require('../../data/patchConsentRequestsRequest.json');
const putConsentRequestsRequests = require('../../data/putConsentRequestsRequest.json');
const putConsentRequestsRequestError = require('../../data/putConsentRequestsRequestError.json');
const postConsentRequestsRequest = require('../../data/postConsentRequestsRequest.json');
const patchSuccessRequest = require('../../data/patchThirdpartyRequestTransaction.json');

const withProtocol = (url) => `http://${url}`;

describe('Thirdparty Requests Tests -->', () => {
    beforeEach(() => {
        mockAxios.reset();
    });

    describe('putConsents', () => {
        const config = mockConfigDto();

        beforeEach(() => {
            mockAxios.onPut().reply(202, {}, jsonContentTypeHeader);
        });

        it('executes a `PUT /consents/{id}` request', async () => {
            const tpr = new ThirdpartyRequests(config);
            const consentId = '123';
            const destFspId = 'dfspa';

            // Act
            await tpr.putConsents(consentId, putConsentsRequest, destFspId);

            // Assert
            const calls = mockAxios.history.put;
            expect(calls.length).toBe(1);
            expect(calls[0]).toEqual(
                expect.objectContaining({
                    baseURL: withProtocol(config.thirdpartyRequestsEndpoint),
                    method: 'put',
                    url: `/consents/${consentId}`,
                    headers: expect.objectContaining({
                        'fspiop-destination': destFspId
                    })
                })
            );
        });
    });

    describe('patchConsents', () => {
        const config = mockConfigDto();

        beforeEach(() => {
            mockAxios.onPatch().reply(202, {}, jsonContentTypeHeader);
        });

        const consentId = '123';
        const destFspId = 'dfspa';
        const expected = expect.objectContaining({
            baseURL: withProtocol(config.thirdpartyRequestsEndpoint),
            method: 'patch',
            url: `/consents/${consentId}`,
            headers: expect.objectContaining({
                'fspiop-destination': destFspId
            })
        });

        it('executes a `PATCH /consents/{id}` request', async () => {
            const tpr = new ThirdpartyRequests(config);

            await tpr.patchConsents(consentId, patchConsentsRequest, destFspId);

            const calls = mockAxios.history.patch;
            expect(calls.length).toBe(1);
            expect(calls[0].data).toBe(JSON.stringify(patchConsentsRequest));
            expect(calls[0]).toEqual(expected);
        });

        it('executes a `PATCH /consents/{id}` request with signing enabled', async () => {
            const config2 = mockConfigDto({ jwsSign: true });
            const tpr = new ThirdpartyRequests(config2);

            await tpr.patchConsents(consentId, patchConsentsRequest, destFspId);

            const calls = mockAxios.history.patch;
            expect(calls.length).toBe(1);
            expect(calls[0].headers['fspiop-signature']).toBeTruthy();
            expect(calls[0].data).toBe(JSON.stringify(patchConsentsRequest));
            expect(calls[0]).toEqual(expected);
        });
    });

    describe('postConsents', () => {
        const config = mockConfigDto();

        beforeEach(() => {
            mockAxios.onPost().reply(202, {}, jsonContentTypeHeader);
        });

        it('executes a `POST /consents` request', async () => {
            const tpr = new ThirdpartyRequests(config);
            const consentBody = postConsentsRequest;
            const expected = expect.objectContaining({
                baseURL: withProtocol(config.thirdpartyRequestsEndpoint),
                method: 'post',
                url: '/consents',
                headers: expect.objectContaining({
                    'fspiop-destination': 'dfspa'
                })
            });

            await tpr.postConsents(consentBody, 'dfspa');

            const calls = mockAxios.history.post;
            expect(calls.length).toBe(1);
            expect(calls[0].data).toBe(JSON.stringify(consentBody));
            expect(calls[0]).toEqual(expected);
        });
    });

    describe('patchConsentRequests', () => {
        const config = mockConfigDto();

        beforeEach(() => {
            mockAxios.onPatch().reply(202, {}, jsonContentTypeHeader);
        });

        it('executes a `PATCH /consentRequests/{ID}` request', async () => {
            const tpr = new ThirdpartyRequests(config);
            const consentRequestsBody = patchConsentRequestsRequests;
            const consentRequestsId = '123';
            const expected = expect.objectContaining({
                baseURL: withProtocol(config.thirdpartyRequestsEndpoint),
                method: 'patch',
                url: '/consentRequests/123',
                headers: expect.objectContaining({
                    'fspiop-destination': 'dfspa'
                })
            });

            await tpr.patchConsentRequests(consentRequestsId, consentRequestsBody, 'dfspa');

            const calls = mockAxios.history.patch;
            expect(calls.length).toBe(1);
            expect(calls[0].data).toBe(JSON.stringify(consentRequestsBody));
            expect(calls[0]).toEqual(expected);
        });
    });

    describe('putConsentRequests', () => {
        const config = mockConfigDto();

        beforeEach(() => {
            mockAxios.onPut().reply(202, {}, jsonContentTypeHeader);
        });

        it('executes a `PUT /consentRequests/{ID}` request', async () => {
            const tpr = new ThirdpartyRequests(config);
            const consentRequestsBody = putConsentRequestsRequests;
            const consentRequestsId = '123';
            const expected = expect.objectContaining({
                baseURL: withProtocol('thirdparty-api-adapter.local'),
                method: 'put',
                url: '/consentRequests/123',
                headers: expect.objectContaining({
                    'fspiop-destination': 'dfspa'
                })
            });

            await tpr.putConsentRequests(consentRequestsId, consentRequestsBody, 'dfspa');

            const calls = mockAxios.history.put;
            expect(calls.length).toBe(1);
            expect(calls[0].data).toBe(JSON.stringify(consentRequestsBody));
            expect(calls[0]).toEqual(expected);
        });
    });

    describe('putConsentRequestsRequestError', () => {
        const config = mockConfigDto();

        beforeEach(() => {
            mockAxios.onPut().reply(202, {}, jsonContentTypeHeader);
        });

        it('executes a `PUT /consentRequests/{ID}/error` request', async () => {
            const tpr = new ThirdpartyRequests(config);
            const requestBody = putConsentRequestsRequestError;
            const consentRequestId = '12345';

            await tpr.putConsentRequestsError(consentRequestId, requestBody, 'pispa');

            const calls = mockAxios.history.put;
            expect(calls.length).toBe(1);
            expect(calls[0].data).toBe(JSON.stringify(requestBody));
            expect(calls[0]).toEqual(
                expect.objectContaining({
                    method: 'put',
                    url: '/consentRequests/12345/error',
                    headers: expect.objectContaining({
                        'fspiop-destination': 'pispa'
                    })
                })
            );
        });
    });

    describe('postConsentRequests', () => {
        const config = mockConfigDto();

        beforeEach(() => {
            mockAxios.onPost().reply(202, {}, jsonContentTypeHeader);
        });

        it('executes a `POST /consentRequests` request', async () => {
            const tpr = new ThirdpartyRequests(config);
            const consentRequestBody = postConsentRequestsRequest;
            const expected = expect.objectContaining({
                baseURL: withProtocol('thirdparty-api-adapter.local'),
                method: 'post',
                url: '/consentRequests',
                headers: expect.objectContaining({
                    'fspiop-destination': 'dfspa'
                })
            });

            await tpr.postConsentRequests(consentRequestBody, 'dfspa');

            const calls = mockAxios.history.post;
            expect(calls.length).toBe(1);
            expect(calls[0].data).toBe(JSON.stringify(consentRequestBody));
            expect(calls[0]).toEqual(expected);
        });
    });

    describe('patchThirdpartyRequestsTransactions', () => {
        const config = mockConfigDto();

        beforeEach(() => {
            mockAxios.onPatch().reply(202, {}, jsonContentTypeHeader);
        });

        it('executes a `PATCH /thirdpartyRequests/transactions/{ID}` request', async () => {
            const tpr = new ThirdpartyRequests(config);
            const requestBody = patchSuccessRequest;
            const transactionRequestId = 1;

            await tpr.patchThirdpartyRequestsTransactions(requestBody, transactionRequestId, 'pispa');

            const calls = mockAxios.history.patch;
            expect(calls.length).toBe(1);
            expect(calls[0].data).toBe(JSON.stringify(requestBody));
            expect(calls[0]).toEqual(
                expect.objectContaining({
                    method: 'patch',
                    url: '/thirdpartyRequests/transactions/1',
                    headers: expect.objectContaining({
                        'fspiop-destination': 'pispa'
                    })
                })
            );
        });
    });

    describe('getThirdpartyRequestsTransactions', () => {
        const config = mockConfigDto();

        beforeEach(() => {
            mockAxios.onGet().reply(202, {}, jsonContentTypeHeader);
        });

        it('executes a `GET /thirdpartyRequests/transactions/{ID}` request', async () => {
            const tpr = new ThirdpartyRequests(config);
            const transactionRequestId = 1;

            await tpr.getThirdpartyRequestsTransactions(transactionRequestId, 'dfspa');

            const calls = mockAxios.history.get;
            expect(calls.length).toBe(1);
            expect(calls[0]).toEqual(
                expect.objectContaining({
                    method: 'get',
                    url: '/thirdpartyRequests/transactions/1',
                    headers: expect.objectContaining({
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

        const config = mockConfigDto();

        // const oidc = new OIDCAuth({ logger: mockLogger({ app: '*ThirdpartyRequestsAuthorizations-test' }) }, undefined);
        //
        // const config = {
        //     logger: mockLogger({ app: '*ThirdpartyRequestsAuthorizations-test' }, undefined),
        //     peerEndpoint: '127.0.0.1',
        //     tls: {
        //         mutualTLS: {
        //             enabled: false
        //         }
        //     },
        //     jwsSign: false,
        //     jwsSignPutParties: false,
        //     jwsSigningKey: jwsSigningKey,
        //     oidc,
        // };

        it('executes a POST /thirdpartyRequests/authorizations call', async () => {
            mockAxios.onPost().reply(202, {}, jsonContentTypeHeader);
            const tpr = new ThirdpartyRequests(config);

            await tpr.postThirdpartyRequestsAuthorizations(postThirdpartyRequestsAuthorizationBody, 'dfspa');

            const calls = mockAxios.history.post;
            expect(calls.length).toBe(1);
            expect(calls[0].data).toBe(JSON.stringify(postThirdpartyRequestsAuthorizationBody));
            expect(calls[0]).toEqual(
                expect.objectContaining({
                    method: 'post',
                    url: '/thirdpartyRequests/authorizations',
                    headers: expect.objectContaining({
                        'fspiop-destination': 'dfspa'
                    })
                })
            );
        });

        it('executes a PUT /thirdpartyRequests/authorizations/{ID} call', async () => {
            mockAxios.onPut().reply(202, {}, jsonContentTypeHeader);
            const tpr = new ThirdpartyRequests(config);
            const authorizationRequestId = 1;

            await tpr.putThirdpartyRequestsAuthorizations(putThirdpartyRequestsAuthorizationBody, authorizationRequestId, 'dfspa');

            const calls = mockAxios.history.put;
            expect(calls.length).toBe(1);
            expect(calls[0].data).toBe(JSON.stringify(putThirdpartyRequestsAuthorizationBody));
            expect(calls[0]).toEqual(
                expect.objectContaining({
                    method: 'put',
                    url: '/thirdpartyRequests/authorizations/1',
                    headers: expect.objectContaining({
                        'fspiop-destination': 'dfspa'
                    })
                })
            );
        });

        it('executes a PUT /thirdpartyRequests/authorizations/{ID}/error call', async () => {
            mockAxios.onPut().reply(202, {}, jsonContentTypeHeader);
            const tpr = new ThirdpartyRequests(config);
            const authorizationRequestId = 1;

            await tpr.putThirdpartyRequestsAuthorizationsError(putThirdpartyRequestsAuthorizationErrorBody, authorizationRequestId, 'dfspa');

            const calls = mockAxios.history.put;
            expect(calls.length).toBe(1);
            expect(calls[0].data).toBe(JSON.stringify(putThirdpartyRequestsAuthorizationErrorBody));
            expect(calls[0]).toEqual(
                expect.objectContaining({
                    method: 'put',
                    url: '/thirdpartyRequests/authorizations/1/error',
                    headers: expect.objectContaining({
                        'fspiop-destination': 'dfspa'
                    })
                })
            );
        });
    });

    describe('accountRequests', () => {
        const putAccountsRequest = require('../../data/putAccountsByUserIdRequest.json');
        const putErrorRequest = require('../../data/putAccountsByRequestError.json');

        const config = mockConfigDto();

        it('executes a `GET /accounts/{ID}` request', async () => {
            mockAxios.onGet().reply(202, {}, jsonContentTypeHeader);
            const tpr = new ThirdpartyRequests(config);
            const userId = 'username1234';

            // Act
            await tpr.getAccounts(userId, 'dfspa');

            const calls = mockAxios.history.get;
            expect(calls.length).toBe(1);
            expect(calls[0]).toEqual(
                expect.objectContaining({
                    method: 'get',
                    url: '/accounts/username1234',
                    headers: expect.objectContaining({
                        'fspiop-destination': 'dfspa'
                    })
                })
            );
        });

        it('executes a `PUT /accounts/{ID}` request', async () => {
            mockAxios.onPut().reply(202, {}, jsonContentTypeHeader);
            const tpr = new ThirdpartyRequests(config);
            const requestBody = putAccountsRequest;
            const userId = 'username1234';

            await tpr.putAccounts(userId, requestBody, 'pispa');

            const calls = mockAxios.history.put;
            expect(calls.length).toBe(1);
            expect(calls[0].data).toBe(JSON.stringify(requestBody));
            expect(calls[0]).toEqual(
                expect.objectContaining({
                    method: 'put',
                    url: '/accounts/username1234',
                    headers: expect.objectContaining({
                        'fspiop-destination': 'pispa'
                    })
                })
            );
        });

        it('executes a `PUT /accounts/{ID}/error` request', async () => {
            mockAxios.onPut().reply(202, {}, jsonContentTypeHeader);
            const tpr = new ThirdpartyRequests(config);
            const requestBody = putErrorRequest;
            const userId = 'username1234';

            await tpr.putAccountsError(userId, requestBody, 'pispa');

            const calls = mockAxios.history.put;
            expect(calls.length).toBe(1);
            expect(calls[0].data).toBe(JSON.stringify(requestBody));
            expect(calls[0]).toEqual(
                expect.objectContaining({
                    method: 'put',
                    url: '/accounts/username1234/error',
                    headers: expect.objectContaining({
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

        const config = mockConfigDto();

        it('executes a `POST /thirdpartyRequests/verifications` request', async () => {
            mockAxios.onPost().reply(202, {}, jsonContentTypeHeader);
            const tpr = new ThirdpartyRequests(config);
            const requestBody = postThirdpartyRequestsVerifications;

            // Act
            await tpr.postThirdpartyRequestsVerifications(requestBody, 'pispa');

            const calls = mockAxios.history.post;
            expect(calls.length).toBe(1);
            expect(calls[0].data).toBe(JSON.stringify(requestBody));
            expect(calls[0]).toEqual(
                expect.objectContaining({
                    method: 'post',
                    url: '/thirdpartyRequests/verifications',
                    headers: expect.objectContaining({
                        'fspiop-destination': 'pispa'
                    })
                })
            );
        });

        it('executes a `PUT /thirdpartyRequests/verifications/{ID}` request', async () => {
            mockAxios.onPut().reply(202, {}, jsonContentTypeHeader);

            const tpr = new ThirdpartyRequests(config);
            const requestBody = putThirdpartyRequestsVerificationsId;
            const verificationRequestId = '282352f3-ed76-4a66-91c4-705947060c7e';

            await tpr.putThirdpartyRequestsVerifications(requestBody, verificationRequestId, 'pispa');

            const calls = mockAxios.history.put;
            expect(calls.length).toBe(1);
            expect(calls[0].data).toBe(JSON.stringify(requestBody));
            expect(calls[0]).toEqual(
                expect.objectContaining({
                    method: 'put',
                    url: `/thirdpartyRequests/verifications/${verificationRequestId}`,
                    headers: expect.objectContaining({
                        'fspiop-destination': 'pispa'
                    })
                })
            );
        });

        it('executes a `PUT /thirdpartyRequests/verifications/{ID}/error` request', async () => {
            mockAxios.onPut().reply(202, {}, jsonContentTypeHeader);

            const tpr = new ThirdpartyRequests(config);
            const requestBody = putThirdpartyRequestsVerificationsIdError;
            const verificationRequestId = '282352f3-ed76-4a66-91c4-705947060c7e';

            await tpr.putThirdpartyRequestsVerificationsError(requestBody, verificationRequestId, 'pispa');

            const calls = mockAxios.history.put;
            expect(calls.length).toBe(1);
            expect(calls[0].data).toBe(JSON.stringify(requestBody));
            expect(calls[0]).toEqual(
                expect.objectContaining({
                    method: 'put',
                    url: `/thirdpartyRequests/verifications/${verificationRequestId}/error`,
                    headers: expect.objectContaining({
                        'fspiop-destination': 'pispa'
                    })
                })
            );
        });
    });

    describe('servicesRequests', () => {
        const putServicesRequest = require('../../data/putServicesByServiceTypeRequest.json');
        const putErrorRequest = require('../../data/putServicesByServiceTypeRequestError.json');

        const config = mockConfigDto();

        it('resolves to service endpoint', async () => {
            mockAxios.onGet().reply(202, {}, jsonContentTypeHeader);
            const tpr = new ThirdpartyRequests(config);
            const serviceType = 'THIRD_PARTY_DFSP';

            await tpr.getServices(serviceType);

            const calls = mockAxios.history.get;
            expect(calls.length).toBe(1);
            expect(calls[0]).toEqual(expect.objectContaining({
                baseURL: withProtocol(config.servicesEndpoint)
            }));
        });

        it('executes a `GET /services/{ServiceType}` request', async () => {
            mockAxios.onGet().reply(202, {}, jsonContentTypeHeader);
            const tpr = new ThirdpartyRequests(config);
            const serviceType = 'THIRD_PARTY_DFSP';

            await tpr.getServices(serviceType);

            const calls = mockAxios.history.get;
            expect(calls.length).toBe(1);
            expect(calls[0]).toEqual(
                expect.objectContaining({
                    method: 'get',
                    url: '/services/THIRD_PARTY_DFSP'
                })
            );
        });

        it('executes a `PUT /services/{ServiceType}` request', async () => {
            mockAxios.onPut().reply(202, {}, jsonContentTypeHeader);

            const tpr = new ThirdpartyRequests(config);
            const requestBody = putServicesRequest;
            const serviceType = 'THIRD_PARTY_DFSP';

            await tpr.putServices(serviceType, requestBody, 'pispa');

            const calls = mockAxios.history.put;
            expect(calls.length).toBe(1);
            expect(calls[0].data).toBe(JSON.stringify(requestBody));
            expect(calls[0]).toEqual(
                expect.objectContaining({
                    method: 'put',
                    url: '/services/THIRD_PARTY_DFSP',
                    headers: expect.objectContaining({
                        'fspiop-destination': 'pispa'
                    })
                })
            );
        });

        it('executes a `PUT /services/{ID}/error` request', async () => {
            mockAxios.onPut().reply(202, {}, jsonContentTypeHeader);

            const tpr = new ThirdpartyRequests(config);
            const requestBody = putErrorRequest;
            const serviceType = 'THIRD_PARTY_DFSP';

            await tpr.putServicesError(serviceType, requestBody, 'pispa');

            const calls = mockAxios.history.put;
            expect(calls.length).toBe(1);
            expect(calls[0].data).toBe(JSON.stringify(requestBody));
            expect(calls[0]).toEqual(
                expect.objectContaining({
                    method: 'put',
                    url: '/services/THIRD_PARTY_DFSP/error',
                    headers: expect.objectContaining({
                        'fspiop-destination': 'pispa'
                    })
                })
            );
        });
    });
});

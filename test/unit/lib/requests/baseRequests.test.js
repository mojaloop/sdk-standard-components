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

 * ModusBox
 - James Bush - james.bush@modusbox.com - ORIGINAL AUTHOR

 --------------
 ******/

const { mockAxios, jsonContentTypeHeader } = require('#test/unit/utils');

const BaseRequests = require('../../../../src/lib/requests/baseRequests');
const mockLogger = require('../../../__mocks__/mockLogger');
const { ApiType } = require('../../../../src/lib/requests/apiTransformer');

const postQuotesBody = require('../../data/quoteRequest.json');
const putPartiesBody = require('../../data/putPartiesBody.json');
const patchTransfersBody = require('../../data/patchTransfersBody.json');

describe('BaseRequests wso2 authorisation', () => {
    let wso2Auth, defaultConf;

    beforeEach(() => {
        wso2Auth = {
            refreshToken: jest.fn(() => 'fake-token'),
        };
        defaultConf = {
            logger: mockLogger({ app: 'BaseRequests test' }, undefined),
            peerEndpoint: '127.0.0.1',
            tls: {
                mutualTLS: {
                    enabled: false
                }
            },
        };
        mockAxios.reset();
        mockAxios.onAny().reply(401, {}, jsonContentTypeHeader);
    });

    it('should not retry requests when not configured to do so', async () => {
        expect.hasAssertions();
        const conf = {
            ...defaultConf,
            wso2: {
                auth: wso2Auth,
                // retryWso2AuthFailureTimes: undefined, // the default
            }
        };

        const br = new BaseRequests(conf);
        await br._request({ uri: 'http://what.ever' })
            .catch((err) => {
                expect(err.status).toBe(401);
                expect(mockAxios.history.get.length).toBe(1);
                expect(wso2Auth.refreshToken).not.toHaveBeenCalled();
            });
    });

    it('should retry requests once when configured to do so', async () => {
        expect.hasAssertions();
        const conf = {
            ...defaultConf,
            wso2: {
                auth: wso2Auth,
                retryWso2AuthFailureTimes: 1,
            },
        };

        const br = new BaseRequests(conf);
        await br._request({ uri: 'http://what.ever', headers: {} })
            .catch((err) => {
                expect(err.status).toBe(401);
                expect(mockAxios.history.get.length).toBe(conf.wso2.retryWso2AuthFailureTimes + 1);
                expect(wso2Auth.refreshToken).toHaveBeenCalledTimes(conf.wso2.retryWso2AuthFailureTimes);
            });
    });

    it('should retry requests multiple times when configured to do so', async () => {
        expect.hasAssertions();
        const conf = {
            ...defaultConf,
            wso2: {
                auth: wso2Auth,
                retryWso2AuthFailureTimes: 5,
            },
        };

        const br = new BaseRequests(conf);
        await br._request({ uri: 'http://what.ever', headers: {} })
            .catch((err) => {
                expect(err.status).toBe(401);
                expect(mockAxios.history.get.length).toBe(conf.wso2.retryWso2AuthFailureTimes + 1);
                expect(wso2Auth.refreshToken).toHaveBeenCalledTimes(conf.wso2.retryWso2AuthFailureTimes);
            });
    });
});

describe('BaseRequests', () => {
    let defaultConf;

    beforeEach(() => {
        defaultConf = {
            logger: mockLogger({ app: 'BaseRequests test' }, undefined),
            peerEndpoint: '127.0.0.1',
            tls: {
                mutualTLS: {
                    enabled: false
                }
            },
            dfspId: 'testdfsp',
        };
        mockAxios.reset();
        mockAxios.onAny().reply(200, {}, jsonContentTypeHeader);
    });

    it('returns original request details for GET calls when response type is mojaloop', async () => {
        const conf = {
            ...defaultConf,
        };

        const br = new BaseRequests(conf);
        const res = await br._get('parties/MSISDN/1234567',
            'parties',
            'somefsp');

        expect(res).not.toBeUndefined();
        expect(res.originalRequest).not.toBeUndefined();
    });

    it('returns original request details for DELETE calls when response type is mojaloop', async () => {
        const conf = {
            ...defaultConf,
        };

        const br = new BaseRequests(conf);
        const res = await br._delete('participants/MSISDN/1234567',
            'participants',
            'somefsp');

        expect(res).not.toBeUndefined();
        expect(res.originalRequest).not.toBeUndefined();
    });

    it('returns original request details for POST calls when response type is mojaloop', async () => {
        const conf = {
            ...defaultConf,
        };

        const br = new BaseRequests(conf);
        const res = await br._post('quotes',
            'quotes',
            {},
            'somefsp');

        expect(res).not.toBeUndefined();
        expect(res.originalRequest).not.toBeUndefined();
    });

    it('returns original request details for PUT calls when response type is mojaloop', async () => {
        const conf = {
            ...defaultConf,
        };

        const br = new BaseRequests(conf);
        const res = await br._put('quotes/1234567',
            'quotes',
            {},
            'somefsp');

        expect(res).not.toBeUndefined();
        expect(res.originalRequest).not.toBeUndefined();
    });

    it('returns original request details for PATCH calls when response type is mojaloop', async () => {
        const conf = {
            ...defaultConf,
        };

        const br = new BaseRequests(conf);
        const res = await br._patch('transfers/1234567',
            'transfers',
            {},
            'somefsp');

        expect(res).not.toBeUndefined();
        expect(res.originalRequest).not.toBeUndefined();
    });

    it('constructs an apiTransformer upon construction', async () => {
        const conf = {
            ...defaultConf,
        };

        const br = new BaseRequests(conf);

        expect(br._apiTransformer).not.toBeUndefined();
    });

    it('transforms an FSPIOP POST request to an ISO20022 POST request when API type is ISO20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022,
        };
        const br = new BaseRequests(conf);

        const res = await br._post('quotes',
            'quotes',
            postQuotesBody,
            'somefsp',
            undefined,
            undefined,
            undefined,
            { SubId: 'abc' }
        );

        const reqBody = res.originalRequest.data;

        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.iso20022.quotes+json;version=1.0');

        // check the body was converted to ISO20022
        // note that we dont check that the content of the ISO body is correct, that is up to the tests around the
        // transformer lib. We just check if the body was changed to an iso form by looking for one or two expected
        // values.
        expect(reqBody.GrpHdr).not.toBeUndefined();
    });

    it('transforms an FSPIOP PUT request to an ISO20022 PUT request when API type is ISO20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022,
        };
        const br = new BaseRequests(conf);

        const res = await br._put('parties/MSISDN/0123456789',
            'parties',
            putPartiesBody,
            'somefsp',
            undefined,
            undefined,
            undefined,
            { Type: 'MSISDN', ID: '0123456789' }
        );

        const reqBody = res.originalRequest.data;

        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.iso20022.parties+json;version=1.0');

        // check the body was converted to ISO20022
        // note that we dont check that the content of the ISO body is correct, that is up to the tests around the
        // transformer lib. We just check if the body was changed to an iso form by looking for one or two expected
        // values.
        expect(reqBody.Assgnmt).not.toBeUndefined();
        expect(reqBody.Rpt).not.toBeUndefined();
        expect(reqBody.Rpt.OrgnlId).toEqual('MSISDN/0123456789');
    });

    it('transforms an FSPIOP PATCH request to an ISO20022 PATCH request when API type is ISO20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022,
        };
        const br = new BaseRequests(conf);

        const res = await br._patch('transfers/20508186-1458-4ac0-a824-d4b07e37d7b3',
            'transfers',
            patchTransfersBody,
            'somefsp',
            undefined,
            undefined,
            undefined,
            undefined
        );

        const reqBody = res.originalRequest.data;

        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.iso20022.transfers+json;version=1.0');

        // check the body was converted to ISO20022
        // note that we dont check that the content of the ISO body is correct, that is up to the tests around the
        // transformer lib. We just check if the body was changed to an iso form by looking for one or two expected
        // values.
        expect(reqBody.GrpHdr).not.toBeUndefined();
        expect(reqBody.TxInfAndSts).not.toBeUndefined();
    });
});

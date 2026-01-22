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

const { TransformFacades } = require('@mojaloop/ml-schema-transformer-lib');
const mr = require('../../../../src/lib/requests/mojaloopRequests.js');
const { ApiType, ISO_20022_HEADER_PART } = require('../../../../src/lib/constants');
const { mockConfigDto } = require('../../../fixtures');

// dummy request bodies
const putPartiesBody = require('../../data/putPartiesBody.json');
const putErrorBody = require('../../data/putErrorBody.json');
const postParticipantsBody = require('../../data/postParticipantsBody.json');
const putParticipantsBody = require('../../data/putParticipantsBody.json');
const postQuotesBody = require('../../data/quoteRequest.json');
const putQuotesBody = require('../../data/putQuotesBody.json');
const postTransfersBody = require('../../data/transferRequest.json');
const putTransfersBody = require('../../data/putTransfersBody.json');
const patchTransfersBody = require('../../data/patchTransfersBody.json');
const postFxQuotesBody = require('../../data/postFxQuotesBody.json');
const putFxQuotesBody = require('../../data/putFxQuotesBody.json');
const postFxTransfersBody = require('../../data/postFxTransfersBody.json');
const putFxTransfersBody = require('../../data/putFxTransfersBody.json');

const expectIsoQuotesErrorBody = (res, putErrorBody, contentType) => {
    const reqBody = res.originalRequest.data;
    expect(res.originalRequest.headers['content-type']).toEqual(contentType);
    expect(reqBody.GrpHdr).not.toBeUndefined();
    expect(reqBody.TxInfAndSts).not.toBeUndefined();
    expect(reqBody.TxInfAndSts.StsRsnInf).not.toBeUndefined();
    expect(reqBody.TxInfAndSts.StsRsnInf.Rsn).not.toBeUndefined();
    expect(reqBody.TxInfAndSts.StsRsnInf.Rsn.Prtry).toEqual(putErrorBody.errorInformation.errorCode);
};

const expectUntransformedBodyWithContentType = (res, contentType, expectedBody) => {
    const reqBody = res.originalRequest.data;
    expect(res.originalRequest.headers['content-type']).toEqual(contentType);
    expect(reqBody).toEqual(expectedBody);
};

describe('PUT /parties', () => {
    beforeEach(() => {
        mockAxios.reset();
        mockAxios.onPut(/^\/parties/).reply(200, {}, jsonContentTypeHeader);
    });

    async function testPutParties (jwsSign, jwsSignPutParties, expectUndefined) {
        const conf = mockConfigDto({ jwsSign, jwsSignPutParties });

        const testMr = new mr(conf);
        await testMr.putParties('MSISDN', '123456', '', 'dummy');

        const signature = mockAxios.history.put[0].headers['fspiop-signature'];
        if (expectUndefined) {
            expect(signature).toBeUndefined();
        } else {
            expect(signature).toBeTruthy();
        }
    }

    test(
        'signs put parties when jwsSign and jwsSignPutParties are true',
        async () => {
            await testPutParties(true, true, false);
        }
    );

    test(
        'does not sign put parties when jwsSign is true and jwsSignPutParties is false',
        async () => {
            await testPutParties(true, false, true);
        }
    );

    test(
        'does not sign put parties when jwsSign and jwsSignPutParties are false',
        async () => {
            await testPutParties(false, false, true);
        }
    );

    test(
        'does not sign put parties when jwsSign is false and jwsSignPutParties is true',
        async () => {
            await testPutParties(false, true, true);
        }
    );

    it('should be able to pass additional axios options', async () => {
        const timeout = 123;
        const maxRedirects = 12345;
        const conf = {
            ...mockConfigDto(),
            httpConfig: { timeout, maxRedirects }
        };
        const testMr = new mr(conf);
        await testMr.putParties('MSISDN', '123456', '', {});

        expect(mockAxios.history.put.length).toBe(1);
        expect(mockAxios.history.put[0].timeout).toBe(timeout);
        expect(mockAxios.history.put[0].maxRedirects).toBe(maxRedirects);
    });
});

describe('PUT /quotes', () => {
    beforeEach(() => {
        mockAxios.reset();
        mockAxios.onPut(/^\/quotes/).reply(200, {}, jsonContentTypeHeader);
    });

    async function testPutQuotes (jwsSign, jwsSignPutParties, expectUndefined) {
        const conf = mockConfigDto({ jwsSign, jwsSignPutParties });

        const testMr = new mr(conf);
        await testMr.putQuotes('fake-quote', { quoteId: 'dummy' }, 'dummy');

        const signature = mockAxios.history.put[0].headers['fspiop-signature'];
        if (expectUndefined) {
            expect(signature).toBeUndefined();
        } else {
            expect(signature).toBeTruthy();
        }
    }

    test(
        'signs put quotes when jwsSign is true and jwsSignPutParties is false',
        async () => {
            await testPutQuotes(true, false, false);
        }
    );

    test(
        'does not sign put quotes when jwsSign is false and jwsSignPutParties is true',
        async () => {
            await testPutQuotes(false, true, true);
        }
    );

    test(
        'does not sign put quotes when jwsSign is false and jwsSignPutParties is false',
        async () => {
            await testPutQuotes(false, false, true);
        }
    );

    test(
        'signs put parties when jwsSign is true and jwsSignPutParties is not supplied',
        async () => {
            await testPutQuotes(true, undefined);
        }
    );

    test(
        'does not sign put parties when jwsSign is false and jwsSignPutParties is not supplied',
        async () => {
            await testPutQuotes(false, undefined, true);
        }
    );
});

describe('postAuthorizations', () => {
    beforeEach(() => {
        mockAxios.reset();
        mockAxios.onPost(/^\/authorizations/).reply(202, {}, jsonContentTypeHeader);
    });

    const conf = mockConfigDto();

    it('executes a `POST /authorizations` request', async () => {
        const testMR = new mr(conf);
        const authorizationRequest = {
            transactionRequestId: '123',
            authenticationType: 'U2F',
            retriesLeft: '1',
            amount: {
                amount: '100',
                currency: 'U2F'
            },
            transactionId: '987'
        };

        await testMR.postAuthorizations(authorizationRequest, 'pispa');

        const calls = mockAxios.history.post;
        expect(calls.length).toBe(1);
        expect(calls[0].data).toBe(JSON.stringify(authorizationRequest));
        expect(calls[0].headers['fspiop-destination']).toBe('pispa');
        expect(calls[0].url).toBe('/authorizations');
    });
});

describe('patchTransfers', () => {
    beforeEach(() => {
        mockAxios.reset();
        mockAxios.onPatch(/^\/transfers/).reply(202, {}, jsonContentTypeHeader);
    });

    const conf = mockConfigDto();

    it('executes a PATCH /transfers request', async () => {
        const testMR = new mr(conf);
        const now = new Date();
        const xferId = '123456';
        const patchBody = {
            completedTimestamp: now.toISOString(),
            transferState: 'COMMITTED'
        };
        const destFsp = 'patchdfsp';

        await testMR.patchTransfers(xferId, patchBody, destFsp);

        const calls = mockAxios.history.patch;
        expect(calls.length).toBe(1);
        expect(calls[0].data).toBe(JSON.stringify(patchBody));
        expect(calls[0].headers['fspiop-destination']).toBe(destFsp);
        expect(calls[0].url).toBe(`/transfers/${xferId}`);
    });
});

describe('MojaloopRequests', () => {
    const defaultConf = mockConfigDto();

    beforeEach(() => {
        mockAxios.reset();
        mockAxios.onAny().reply(200, {}, jsonContentTypeHeader);
    });

    it('Sends ISO20022 PUT /parties bodies when ApiType is iso20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };
        const testMr = new mr(conf);

        const res = await testMr.putParties(
            putPartiesBody.party.partyIdInfo.partyIdType,
            putPartiesBody.party.partyIdInfo.partyIdentifier,
            putPartiesBody.party.partyIdInfo.partySubIdOrType,
            putPartiesBody,
            'somefsp',
            undefined
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
    });

    it('Sends FSPIOP PUT /parties bodies when ApiType is fspiop', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.FSPIOP
        };
        const testMr = new mr(conf);

        const res = await testMr.putParties(
            putPartiesBody.party.partyIdInfo.partyIdType,
            putPartiesBody.party.partyIdInfo.partyIdentifier,
            putPartiesBody.party.partyIdInfo.partySubIdOrType,
            putPartiesBody,
            'somefsp',
            undefined
        );

        expectUntransformedBodyWithContentType(
            res,
            'application/vnd.interoperability.parties+json;version=1.0',
            putPartiesBody
        );
    });

    it('Sends ISO20022 PUT /parties error bodies when ApiType is iso20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };
        const testMr = new mr(conf);

        const res = await testMr.putPartiesError(
            putPartiesBody.party.partyIdInfo.partyIdType,
            putPartiesBody.party.partyIdInfo.partyIdentifier,
            putPartiesBody.party.partyIdInfo.partySubIdOrType,
            putErrorBody,
            'somefsp',
            undefined
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
        expect(reqBody.Rpt.Vrfctn).toEqual(false);
        expect(reqBody.Rpt.Rsn.Cd).toEqual(putErrorBody.errorInformation.errorCode);
    });

    it('Sends FSPIOP PUT /parties error bodies when ApiType is fspiop', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.FSPIOP
        };
        const testMr = new mr(conf);

        const res = await testMr.putPartiesError(
            putPartiesBody.party.partyIdInfo.partyIdType,
            putPartiesBody.party.partyIdInfo.partyIdentifier,
            putPartiesBody.party.partyIdInfo.partySubIdOrType,
            putErrorBody,
            'somefsp',
            undefined
        );

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.parties+json;version=1.0');

        // check the body was NOT converted to ISO20022
        expect(reqBody).toEqual(putErrorBody);
    });

    it('Sends FSPIOP POST /participants bodies when ApiType is iso20022. Resource type NOT transformed', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };
        const testMr = new mr(conf);

        const res = await testMr.postParticipants(postParticipantsBody, 'somefsp');

        expectUntransformedBodyWithContentType(
            res,
            'application/vnd.interoperability.iso20022.participants+json;version=1.0',
            postParticipantsBody
        );
    });

    it('Sends FSPIOP POST /participants bodies when ApiType is fspiop', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.FSPIOP
        };
        const testMr = new mr(conf);

        const res = await testMr.postParticipants(postParticipantsBody, 'somefsp');

        expectUntransformedBodyWithContentType(
            res,
            'application/vnd.interoperability.participants+json;version=1.0',
            postParticipantsBody
        );
    });

    it('Sends FSPIOP PUT /participants bodies when ApiType is iso20022. Resource type NOT transformed', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };
        const testMr = new mr(conf);

        const res = await testMr.putParticipants(
            'MSISDN',
            '01234567890',
            undefined,
            putParticipantsBody,
            'somefsp'
        );

        expectUntransformedBodyWithContentType(
            res,
            'application/vnd.interoperability.iso20022.participants+json;version=1.0',
            putParticipantsBody
        );
    });

    it('Sends FSPIOP PUT /participants bodies when ApiType is fspiop', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.FSPIOP
        };
        const testMr = new mr(conf);

        const res = await testMr.putParticipants(
            'MSISDN',
            '01234567890',
            undefined,
            putParticipantsBody,
            'somefsp'
        );

        expectUntransformedBodyWithContentType(
            res,
            'application/vnd.interoperability.participants+json;version=1.0',
            putParticipantsBody
        );
    });

    it('Sends FSPIOP PUT /participants error bodies when ApiType is iso20022. Resource type NOT transformed', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };
        const testMr = new mr(conf);

        const res = await testMr.putParticipantsError(
            'MSISDN',
            '01234567890',
            undefined,
            putErrorBody,
            'somefsp'
        );

        expectUntransformedBodyWithContentType(
            res,
            'application/vnd.interoperability.iso20022.participants+json;version=1.0',
            putErrorBody
        );
    });

    it('Sends FSPIOP PUT /participants error bodies when ApiType is fspiop', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.FSPIOP
        };
        const testMr = new mr(conf);

        const res = await testMr.putParticipantsError(
            'MSISDN',
            '01234567890',
            undefined,
            putErrorBody,
            'somefsp'
        );

        expectUntransformedBodyWithContentType(
            res,
            'application/vnd.interoperability.participants+json;version=1.0',
            putErrorBody
        );
    });

    it('Sends ISO20022 POST /quotes bodies when ApiType is iso20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };
        const testMr = new mr(conf);

        const res = await testMr.postQuotes(postQuotesBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.iso20022.quotes+json;version=1.0');

        // check the body was converted to ISO20022
        // note that we dont check that the content of the ISO body is correct, that is up to the tests around the
        // transformer lib. We just check if the body was changed to an iso form by looking for one or two expected
        // values.
        expect(reqBody.GrpHdr).not.toBeUndefined();
        expect(reqBody.CdtTrfTxInf).not.toBeUndefined();
    });

    it('Sends FSPIOP POST /quotes bodies when ApiType is fspiop', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.FSPIOP
        };
        const testMr = new mr(conf);

        const res = await testMr.postQuotes(postQuotesBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.quotes+json;version=1.0');

        // check the body was NOT converted to ISO20022
        expect(reqBody).toEqual(postQuotesBody);
    });

    it('Sends ISO20022 PUT /quotes bodies when ApiType is iso20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };
        const testMr = new mr(conf);

        const res = await testMr.putQuotes(postQuotesBody.quoteId, putQuotesBody, 'somefsp', undefined, { isoPostQuote: {} });

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.iso20022.quotes+json;version=1.0');

        // check the body was converted to ISO20022
        // note that we dont check that the content of the ISO body is correct, that is up to the tests around the
        // transformer lib. We just check if the body was changed to an iso form by looking for one or two expected
        // values.
        expect(reqBody.GrpHdr).not.toBeUndefined();
        expect(reqBody.CdtTrfTxInf).not.toBeUndefined();
    });

    it('Sends ISO20022 PUT /quotes bodies when ApiType is iso20022 and $context.isoPostQuote is specified and testing mode=false', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };
        const testMr = new mr(conf);

        const isoPostQuoteContext = await TransformFacades.FSPIOP.quotes.post({ body: postQuotesBody });
        const res = await testMr.putQuotes(postQuotesBody.quoteId, putQuotesBody, 'somefsp', undefined, { isoPostQuote: isoPostQuoteContext.body });

        const reqBody = res.originalRequest.data;

        // Test fields that transformed when given previous iso quote as context
        expect(reqBody.CdtTrfTxInf.ChrgBr).toEqual('DEBT');
        expect(reqBody.CdtTrfTxInf.Cdtr).toBeDefined();
        expect(reqBody.CdtTrfTxInf.Dbtr).toBeDefined();
        expect(reqBody.CdtTrfTxInf.CdtrAgt).toBeDefined();
        expect(reqBody.CdtTrfTxInf.DbtrAgt).toBeDefined();
        expect(reqBody.CdtTrfTxInf.ChrgsInf.Agt).toBeDefined();
    });

    it('Sends FSPIOP PUT /quotes bodies when ApiType is fspiop', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.FSPIOP
        };
        const testMr = new mr(conf);

        const res = await testMr.putQuotes(postQuotesBody.quoteId, putQuotesBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.quotes+json;version=1.0');

        // check the body was NOT converted to ISO20022
        expect(reqBody).toEqual(putQuotesBody);
    });

    it('Sends ISO20022 PUT /quotes error bodies when ApiType is iso20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };
        const testMr = new mr(conf);

        const res = await testMr.putQuotesError(postQuotesBody.quoteId, putErrorBody, 'somefsp');

        expectIsoQuotesErrorBody(
            res,
            putErrorBody,
            'application/vnd.interoperability.iso20022.quotes+json;version=1.0'
        );
    });

    it('Sends FSPIOP PUT /quotes error bodies when ApiType is fspiop', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.FSPIOP
        };
        const testMr = new mr(conf);

        const res = await testMr.putQuotesError(postQuotesBody.quoteId, putErrorBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.quotes+json;version=1.0');

        // check the body was NOT converted to ISO20022
        expect(reqBody).toEqual(putErrorBody);
    });

    it('Sends ISO20022 POST /transfers bodies when ApiType is iso20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };

        const testMr = new mr(conf);

        const res = await testMr.postTransfers(postTransfersBody, 'somefsp', {}, { isoPostQuote: {} });

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.iso20022.transfers+json;version=1.0');

        // check the body was converted to ISO20022
        // note that we dont check that the content of the ISO body is correct, that is up to the tests around the
        // transformer lib. We just check if the body was changed to an iso form by looking for one or two expected
        // values.
        expect(reqBody.GrpHdr).not.toBeUndefined();
        expect(reqBody.CdtTrfTxInf).not.toBeUndefined();
        expect(reqBody.CdtTrfTxInf.PmtId).not.toBeUndefined();
        expect(reqBody.CdtTrfTxInf.PmtId.TxId).toEqual(postTransfersBody.transferId);
    });

    it('Sends ISO20022 POST /transfers bodies when ApiType is iso20022 and $context.isoPostQuote is specified and testing mode=false', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };
        const testMr = new mr(conf);

        const isoPostQuote = await TransformFacades.FSPIOP.quotes.post({ body: postQuotesBody });
        const isoPutQuoteContext = await TransformFacades.FSPIOP.quotes.put({ params: { ID: '1234' }, body: putQuotesBody, $context: { isoPostQuote: isoPostQuote.body } });

        const res = await testMr.postTransfers(postTransfersBody, 'somefsp', {}, { isoPostQuoteResponse: isoPutQuoteContext.body });

        const reqBody = res.originalRequest.data;
        // Test fields that transformed when given previous iso quote as context
        expect(reqBody.CdtTrfTxInf.ChrgBr).toEqual('DEBT');
        expect(reqBody.CdtTrfTxInf.Cdtr).toBeDefined();
        expect(reqBody.CdtTrfTxInf.Dbtr).toBeDefined();
    });

    it('Sends FSPIOP PUT /transfers bodies when ApiType is fspiop', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.FSPIOP
        };
        const testMr = new mr(conf);

        const res = await testMr.postTransfers(postTransfersBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.transfers+json;version=1.0');

        // check the body was NOT converted to ISO20022
        expect(reqBody).toEqual(postTransfersBody);
    });

    it('Sends ISO20022 PUT /transfers bodies when ApiType is iso20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };
        const testMr = new mr(conf);

        const res = await testMr.putTransfers(postTransfersBody.transferId, putTransfersBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.iso20022.transfers+json;version=1.0');

        // check the body was converted to ISO20022
        // note that we dont check that the content of the ISO body is correct, that is up to the tests around the
        // transformer lib. We just check if the body was changed to an iso form by looking for one or two expected
        // values.
        expect(reqBody.GrpHdr).not.toBeUndefined();
        expect(reqBody.TxInfAndSts).not.toBeUndefined();
        expect(reqBody.TxInfAndSts.ExctnConf).toEqual(putTransfersBody.fulfilment);
    });

    it('Sends FSPIOP PUT /transfers bodies when ApiType is fspiop', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.FSPIOP
        };
        const testMr = new mr(conf);

        const res = await testMr.putTransfers(postTransfersBody.transferId, putTransfersBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.transfers+json;version=1.0');

        // check the body was NOT converted to ISO20022
        expect(reqBody).toEqual(putTransfersBody);
    });

    it('Sends ISO20022 PATCH /transfers bodies when ApiType is iso20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };
        const testMr = new mr(conf);

        const res = await testMr.patchTransfers(postTransfersBody.transferId, patchTransfersBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.iso20022.transfers+json;version=1.0');

        // check the body was converted to ISO20022
        // note that we dont check that the content of the ISO body is correct, that is up to the tests around the
        // transformer lib. We just check if the body was changed to an iso form by looking for one or two expected
        // values.
        expect(reqBody.GrpHdr).not.toBeUndefined();
        expect(reqBody.TxInfAndSts).not.toBeUndefined();
        expect(reqBody.TxInfAndSts.TxSts).toEqual('COMM');
    });

    it('Sends FSPIOP PATCH /transfers bodies when ApiType is fspiop', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.FSPIOP
        };
        const testMr = new mr(conf);

        const res = await testMr.patchTransfers(postTransfersBody.transferId, patchTransfersBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.transfers+json;version=1.0');

        // check the body was NOT converted to ISO20022
        expect(reqBody).toEqual(patchTransfersBody);
    });

    it('Sends ISO20022 PUT /transfers error bodies when ApiType is iso20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };
        const testMr = new mr(conf);

        const res = await testMr.putTransfersError(postTransfersBody.transferId, putErrorBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.iso20022.transfers+json;version=1.0');

        // check the body was converted to ISO20022
        // note that we dont check that the content of the ISO body is correct, that is up to the tests around the
        // transformer lib. We just check if the body was changed to an iso form by looking for one or two expected
        // values.
        expect(reqBody.GrpHdr).not.toBeUndefined();
        expect(reqBody.TxInfAndSts).not.toBeUndefined();
        expect(reqBody.TxInfAndSts.StsRsnInf).not.toBeUndefined();
        expect(reqBody.TxInfAndSts.StsRsnInf.Rsn).not.toBeUndefined();
        expect(reqBody.TxInfAndSts.StsRsnInf.Rsn.Prtry).toEqual(putErrorBody.errorInformation.errorCode);
    });

    it('Sends FSPIOP PUT /transfers error bodies when ApiType is fspiop', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.FSPIOP
        };
        const testMr = new mr(conf);

        const res = await testMr.putTransfersError(postTransfersBody.transferId, putErrorBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.transfers+json;version=1.0');

        // check the body was NOT converted to ISO20022
        expect(reqBody).toEqual(putErrorBody);
    });

    it('Sends ISO20022 POST /fxQuotes bodies when ApiType is iso20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };
        const testMr = new mr(conf);

        const res = await testMr.postFxQuotes(postFxQuotesBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.iso20022.fxQuotes+json;version=2.0');

        // check the body was converted to ISO20022
        // note that we dont check that the content of the ISO body is correct, that is up to the tests around the
        // transformer lib. We just check if the body was changed to an iso form by looking for one or two expected
        // values.
        expect(reqBody.GrpHdr).not.toBeUndefined();
        expect(reqBody.CdtTrfTxInf).not.toBeUndefined();
        expect(reqBody.CdtTrfTxInf.UndrlygCstmrCdtTrf).not.toBeUndefined();
    });

    it('Sends FSPIOP POST /fxQuotes bodies when ApiType is fspiop', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.FSPIOP
        };
        const testMr = new mr(conf);

        const res = await testMr.postFxQuotes(postFxQuotesBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.fxQuotes+json;version=2.0');

        // check the body was NOT converted to ISO20022
        expect(reqBody).toEqual(postFxQuotesBody);
    });

    it('Sends ISO20022 PUT /fxQuotes bodies when ApiType is iso20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };
        const testMr = new mr(conf);

        const res = await testMr.putFxQuotes(postFxQuotesBody.conversionRequestId, putFxQuotesBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.iso20022.fxQuotes+json;version=2.0');

        // check the body was converted to ISO20022
        // note that we dont check that the content of the ISO body is correct, that is up to the tests around the
        // transformer lib. We just check if the body was changed to an iso form by looking for one or two expected
        // values.
        expect(reqBody.GrpHdr).not.toBeUndefined();
        expect(reqBody.CdtTrfTxInf).not.toBeUndefined();
        expect(reqBody.CdtTrfTxInf.UndrlygCstmrCdtTrf).not.toBeUndefined();
    });

    it('Sends FSPIOP PUT /fxQuotes bodies when ApiType is fspiop', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.FSPIOP
        };
        const testMr = new mr(conf);

        const res = await testMr.putFxQuotes(postFxQuotesBody.conversionRequestId, putFxQuotesBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.fxQuotes+json;version=2.0');

        // check the body was NOT converted to ISO20022
        expect(reqBody).toEqual(putFxQuotesBody);
    });

    it('Sends ISO20022 PUT /fxQuotes error bodies when ApiType is iso20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };
        const testMr = new mr(conf);

        const res = await testMr.putFxQuotesError(postFxQuotesBody.conversionRequestId, putErrorBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.iso20022.fxQuotes+json;version=2.0');

        // check the body was converted to ISO20022
        // note that we dont check that the content of the ISO body is correct, that is up to the tests around the
        // transformer lib. We just check if the body was changed to an iso form by looking for one or two expected
        // values.
        expect(reqBody.GrpHdr).not.toBeUndefined();
        expect(reqBody.TxInfAndSts).not.toBeUndefined();
        expect(reqBody.TxInfAndSts.StsRsnInf).not.toBeUndefined();
        expect(reqBody.TxInfAndSts.StsRsnInf.Rsn).not.toBeUndefined();
        expect(reqBody.TxInfAndSts.StsRsnInf.Rsn.Prtry).toEqual(putErrorBody.errorInformation.errorCode);
    });

    it('Sends FSPIOP PUT /fxQuotes error bodies when ApiType is fspiop', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.FSPIOP
        };
        const testMr = new mr(conf);

        const res = await testMr.putFxQuotesError(postFxQuotesBody.conversionRequestId, putErrorBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.fxQuotes+json;version=2.0');

        // check the body was NOT converted to ISO20022
        expect(reqBody).toEqual(putErrorBody);
    });

    it('Sends ISO20022 POST /fxTransfers bodies when ApiType is iso20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };
        const testMr = new mr(conf);

        const res = await testMr.postFxTransfers(postFxTransfersBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.iso20022.fxTransfers+json;version=2.0');

        // check the body was converted to ISO20022
        // note that we dont check that the content of the ISO body is correct, that is up to the tests around the
        // transformer lib. We just check if the body was changed to an iso form by looking for one or two expected
        // values.
        expect(reqBody.GrpHdr).not.toBeUndefined();
        expect(reqBody.CdtTrfTxInf).not.toBeUndefined();
        expect(reqBody.CdtTrfTxInf.Dbtr).not.toBeUndefined();
    });

    it('Sends FSPIOP POST /fxTransfers bodies when ApiType is fspiop', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.FSPIOP
        };
        const testMr = new mr(conf);

        const res = await testMr.postFxTransfers(postFxTransfersBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.fxTransfers+json;version=2.0');

        // check the body was NOT converted to ISO20022
        expect(reqBody).toEqual(postFxTransfersBody);
    });

    it('Sends ISO20022 PUT /fxTransfers bodies when ApiType is iso20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };
        const testMr = new mr(conf);

        const res = await testMr.putFxTransfers(postFxTransfersBody.commitRequestId, putFxTransfersBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.iso20022.fxTransfers+json;version=2.0');

        // check the body was converted to ISO20022
        // note that we dont check that the content of the ISO body is correct, that is up to the tests around the
        // transformer lib. We just check if the body was changed to an iso form by looking for one or two expected
        // values.
        expect(reqBody.GrpHdr).not.toBeUndefined();
        expect(reqBody.TxInfAndSts).not.toBeUndefined();
        expect(reqBody.TxInfAndSts.TxSts).toEqual('RESV');
    });

    it('Sends FSPIOP PUT /fxTransfers bodies when ApiType is fspiop', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.FSPIOP
        };
        const testMr = new mr(conf);

        const res = await testMr.putFxTransfers(postFxTransfersBody.commitRequestId, putFxTransfersBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.fxTransfers+json;version=2.0');

        // check the body was NOT converted to ISO20022
        expect(reqBody).toEqual(putFxTransfersBody);
    });

    it('Sends ISO20022 PUT /fxTransfers error bodies when ApiType is iso20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };
        const testMr = new mr(conf);

        const res = await testMr.putFxTransfersError(postFxTransfersBody.commitRequestId, putErrorBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.iso20022.fxTransfers+json;version=2.0');

        // check the body was converted to ISO20022
        // note that we dont check that the content of the ISO body is correct, that is up to the tests around the
        // transformer lib. We just check if the body was changed to an iso form by looking for one or two expected
        // values.
        expect(reqBody.GrpHdr).not.toBeUndefined();
        expect(reqBody.TxInfAndSts).not.toBeUndefined();
        expect(reqBody.TxInfAndSts.StsRsnInf).not.toBeUndefined();
        expect(reqBody.TxInfAndSts.StsRsnInf.Rsn).not.toBeUndefined();
        expect(reqBody.TxInfAndSts.StsRsnInf.Rsn.Prtry).toEqual(putErrorBody.errorInformation.errorCode);
    });

    it('Sends FSPIOP PUT /fxTransfers error bodies when ApiType is fspiop', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.FSPIOP
        };
        const testMr = new mr(conf);

        const res = await testMr.putFxTransfersError(postFxTransfersBody.commitRequestId, putErrorBody, 'somefsp');

        const reqBody = res.originalRequest.data;
        // check the correct content type was sent
        expect(res.originalRequest.headers['content-type']).toEqual('application/vnd.interoperability.fxTransfers+json;version=2.0');

        // check the body was NOT converted to ISO20022
        expect(reqBody).toEqual(putErrorBody);
    });

    it('should set FSPIOP headers for putTransactionRequests', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022
        };
        const testMr = new mr(conf);

        const res = await testMr.putTransactionRequests('txnReqId', {}, 'fspId');

        expect(res.originalRequest.headers['content-type']).not.toContain(ISO_20022_HEADER_PART);
    });
});

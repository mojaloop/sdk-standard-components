/*************************************************************************
 *  (C) Copyright Mojaloop Foundation. 2024 - All rights reserved.        *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - jbush@mojaloop.io                                   *
 *                                                                        *
 *  CONTRIBUTORS:                                                         *
 *       James Bush - jbush@mojaloop.io                                   *
 *************************************************************************/

const { ApiType, ApiTransformer } = require('../../../../src/lib/requests/apiTransformer');

const mockLogger = require('../../../__mocks__/mockLogger');

const putPartiesBody = require('../../data/putPartiesBody.json');
const putPartiesHeaders = {
    'Content-Type': 'application/vnd.interoperability.parties+json;version=1.0',
    'fspiop-source': 'payeedfsp',
    'fspiop-destination': 'payerdfsp',
};
const putPartiesParams = {
    Type: 'MSISDN',
    ID: '0123456789'
};

describe('API Transformer', () => {
    let defaultConf;

    beforeEach(() => {
        defaultConf = {
            logger: mockLogger({ app: 'ApiTransformer test' }, undefined),
            apiType: ApiType.FSPIOP,
        };
    });

    afterEach(() => {

    });

    it('Constructs with valid config', async () => {
        const conf = {
            ...defaultConf,
        };

        expect(() =>  {
            new ApiTransformer(conf);
        }).not.toThrow();
    });

    it('Rejects unsupported API type on construction', async () => {
        const conf = {
            ...defaultConf,
            apiType: 'unsupported-type',
        };

        expect(() =>  {
            new ApiTransformer(conf);
        }).toThrow();
    });

    it('Transforms an outgoing request from FSPIOP to ISO20022 when API type is ISO20022', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.ISO20022,
        };

        const tf = new ApiTransformer(conf);

        const ret = await tf.transformOutboundRequest('parties', 'PUT', {
            body: { ...putPartiesBody },
            headers: { ...putPartiesHeaders },
            params: { ...putPartiesParams }
        });

        /* expected transformed body
        {
            Assgnmt: {
              MsgId: '01JAD6ZGJ83A465152CYGEB0DE',
              CreDtTm: '2024-10-17T12:24:28.489Z',
              Assgnr: [Object],
              Assgne: [Object]
            },
            Rpt: { Vrfctn: true, OrgnlId: 'subid', UpdtdPtyAndAcctId: [Object] }
          }
         */

        expect(ret).not.toBeUndefined();
        expect(ret.body).not.toBeUndefined();

        expect(ret.body.Assgnmt).not.toBeUndefined();
        expect(ret.body.Assgnmt.MsgId).not.toBeUndefined();
        expect(ret.body.Assgnmt.CreDtTm).not.toBeUndefined();
        expect(ret.body.Assgnmt.Assgnr).not.toBeUndefined();
        expect(ret.body.Assgnmt.Assgne).not.toBeUndefined();
        expect(ret.body.Rpt).not.toBeUndefined();
    });

    it('Does not transforms an outgoing request from FSPIOP when API type is FSPIOP', async () => {
        const conf = {
            ...defaultConf,
            apiType: ApiType.FSPIOP,
        };

        const tf = new ApiTransformer(conf);

        const ret = await tf.transformOutboundRequest('parties', 'PUT', {
            body: { ...putPartiesBody },
            headers: { ...putPartiesHeaders },
            params: { ...putPartiesParams }
        });


        expect(ret).not.toBeUndefined();
        expect(ret.body).not.toBeUndefined();

        expect(ret.body).toEqual(putPartiesBody);
    });
});

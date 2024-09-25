/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - james.bush@modusbox.com                             *
 **************************************************************************/

'use strict';

const IlpPacket = require('ilp-packet-v1');
const { ilpFactory, ILP_VERSIONS } = require('#src/lib/ilp/index');
const { ILP_AMOUNT_FOR_FX } = require('#src/lib/constants');
const dto = require('#src/lib/dto');

const mockLogger = require('#test/__mocks__/mockLogger');
const fixtures = require('#test/fixtures');
const quoteRequest = require('../../../unit/data/quoteRequest');
const partialResponse = require('../../../unit/data/partialResponse');
const transferRequest = require('../../../unit/data/transferRequest');

describe('IlpV1 Tests -->', () => {
    let ilp;

    beforeEach(() => {
        ilp = ilpFactory(ILP_VERSIONS.v1,{
            secret: 'test',
            logger: mockLogger({ app: 'ilp-test-v1' })
        });
    });

    test('should have getter "version" (v1)', () => {
        expect(ilp.version).toBe(ILP_VERSIONS.v1);
    });

    test('Should generate ILP v1 components for a quote response given a quote request and partial response', () => {
        const {
            fulfilment,
            ilpPacket,
            condition
        } = ilp.getQuoteResponseIlp(quoteRequest, partialResponse);

        expect(fulfilment).toBeTruthy();
        expect(ilpPacket).toBeTruthy();
        expect(condition).toBeTruthy();
    });

    test('should generate ILP v1 components for fxQuote request and partial response', () => {
        const fxQuotesRequest = fixtures.fxQuotesPayload();
        const beResponse = fixtures.fxQuotesBeResponse(fxQuotesRequest);

        const {
            fulfilment,
            ilpPacket,
            condition
        } = ilp.getFxQuoteResponseIlp(fxQuotesRequest, beResponse);

        expect(fulfilment).toBeTruthy();
        expect(ilpPacket).toBeTruthy();
        expect(condition).toBeTruthy();
    });

    test('deserializes the ILP packet into a valid transaction object', () => {
        // Arrange
        const { ilpPacket } = ilp.getQuoteResponseIlp(quoteRequest, partialResponse);
        const expectedDataElement = dto.transactionObjectDto(quoteRequest, partialResponse);

        // Act
        const binaryPacket = Buffer.from(ilpPacket, 'base64');
        const jsonPacket = IlpPacket.deserializeIlpPacket(binaryPacket);
        const dataElement = JSON.parse(Buffer.from(jsonPacket.data.data.toString('utf8'), 'base64').toString('utf8'));

        // Assert
        expect(dataElement).toStrictEqual(expectedDataElement);
    });

    test('ILP fulfilment should match condition', () => {
        // Arrange
        const { fulfilment, ilpPacket, condition } = ilp.getQuoteResponseIlp(quoteRequest, partialResponse);

        // Act
        // Check the ilpPacket here to verify that the 'original source of truth' is valid
        const binaryPacket = Buffer.from(ilpPacket, 'base64');
        const jsonPacket = IlpPacket.deserializeIlpPacket(binaryPacket);
        const dataElement = JSON.parse(Buffer.from(jsonPacket.data.data.toString('utf8'), 'base64').toString('utf8'));
        const valid = ilp.validateFulfil(fulfilment, condition);

        // Assert
        expect(valid).toBeTruthy();
        // We just test that the JSON parsed correctly here - we don't test the format here
        expect(dataElement).toBeDefined();
    });

    test('should generate fulfilment, ilpPacket and condition using shared method "getResponseIlp"', () => {
        const transactionObj = dto.transactionObjectDto(quoteRequest, partialResponse);
        const { fulfilment, ilpPacket, condition } = ilp.getResponseIlp(transactionObj);
        expect(fulfilment).toBeTruthy();
        expect(ilpPacket).toBeTruthy();
        expect(condition).toBeTruthy();
    });

    describe('Ilp Packet Serialize tests -->', () => {
        const createIlpJson = (amount) => ({
            data: Buffer.from('data'),
            account: 'g.dfsp.eur.eur',
            amount
        });
        const serialize = json => IlpPacket.serializeIlpPayment(json);

        test('should throw error if amount as empty string in ilp packet', () => {
            const amount = '';
            expect(() => serialize(createIlpJson(amount)))
                .toThrow();
        });

        test('should be able to use ILP_AMOUNT_FOR_FX ("0") as amount in ilp packet', () => {
            const amount = ILP_AMOUNT_FOR_FX;
            const packet = serialize(createIlpJson(amount));
            expect(Buffer.isBuffer(packet)).toBe(true);
        });

        test('should create ilp packet for fxQuote', () => {
            const fxQuote = fixtures.fxQuotesPayload();
            const packetInput = ilp.makeQuotePacketInput(fxQuote);
            const packet = serialize(packetInput);
            expect(Buffer.isBuffer(packet)).toBe(true);
        });
    });

    describe('Ilp Packet Decoding and Validation', () => {
        let ilpCombo;

        beforeEach(() => {
            ilpCombo = ilp.getQuoteResponseIlp(quoteRequest, partialResponse);
            transferRequest.ilpPacket = ilpCombo.ilpPacket;
            transferRequest.condition = ilpCombo.condition;
        });

        test('Should decode the IlpPacket', () => {
            const decodedIlp = ilp.decodeIlpPacket(ilpCombo.ilpPacket);

            expect(decodedIlp).toBeTruthy();
            expect(decodedIlp).toHaveProperty('amount');
            expect(decodedIlp).toHaveProperty('account');
            expect(decodedIlp).toHaveProperty('data');
        });

        test('Should generate transaction object from an Ilp packet', () => {
            const transactionObject = ilp.getTransactionObject(ilpCombo.ilpPacket);

            expect(transactionObject).toBeTruthy();
            expect(transactionObject).toHaveProperty('transactionId');
            expect(transactionObject).toHaveProperty('quoteId');
            expect(transactionObject).toHaveProperty('payee');
            expect(transactionObject).toHaveProperty('payer');
            expect(transactionObject).toHaveProperty('amount');
            expect(transactionObject).toHaveProperty('transactionType');
        });

        test('Should validate the transfer request against the decoded Ilp packet', () => {
            const validation = ilp.validateIlpAgainstTransferRequest(transferRequest);
            expect(validation).toBe(true);
        });

        test('Should fail the validation if the data in transfer request is changed', () => {
            transferRequest.amount.amount = '200';
            const validation = ilp.validateIlpAgainstTransferRequest(transferRequest);
            expect(validation).toBe(false);
        });

    });
});



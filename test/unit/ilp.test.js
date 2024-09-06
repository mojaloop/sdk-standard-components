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

const IlpPacket = require('ilp-packet');
const Ilp = require('../../src/lib/ilp');
const dto = require('../../src/lib/dto');
const { ILP_ADDRESS, ILP_AMOUNT_FOR_FX } = require('../../src/lib/constants');

const mockLogger = require('../__mocks__/mockLogger');
const fixtures = require('../fixtures');
const quoteRequest = require('./data/quoteRequest');
const partialResponse = require('./data/partialResponse');
const transferRequest = require('./data/transferRequest');

describe('ILP Tests -->', () => {
    let ilp;

    beforeEach(() => {
        ilp = new Ilp({
            secret: 'test',
            logger: mockLogger({ app: 'ilp-test' })
        });
    });

    test('Should generate ILP components for a quote response given a quote request and partial response', () => {
        const {
            fulfilment,
            ilpPacket,
            condition
        } = ilp.getQuoteResponseIlp(quoteRequest, partialResponse);

        expect(fulfilment).toBeTruthy();
        expect(ilpPacket).toBeTruthy();
        expect(condition).toBeTruthy();
    });

    test('deserializes the ILP packet into a valid transaction object', () => {
        // Arrange
        const { ilpPacket } = ilp.getQuoteResponseIlp(quoteRequest, partialResponse);
        const transaction= dto.transactionObjectDto(quoteRequest, partialResponse);

        // Act
        const binaryPacket = Buffer.from(ilpPacket, 'base64');
        const jsonPacket = IlpPacket.deserializeIlpPacket(binaryPacket);
        const dataElement = JSON.parse(Buffer.from(jsonPacket.data.data.toString('utf8'), 'base64').toString('utf8'));

        // Assert
        expect(dataElement).toStrictEqual(transaction);
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
        expect(valid).toBe(true);
        // We just test that the JSON parsed correctly here - we don't test the format here
        expect(dataElement).toBeDefined();
    });

    test('should generate fulfilment, condition and ilpPacket (prepare) using shared method "getResponseIlp"', () => {
        const transactionObj = dto.transactionObjectDto(quoteRequest, partialResponse);
        const { fulfilment, condition, ilpPacket } = ilp.getResponseIlp(transactionObj);
        expect(fulfilment).toBeTruthy();
        expect(condition).toBeTruthy();
        expect(ilpPacket).toBeTruthy();

        const json =  IlpPacket.deserializeIlpPrepare(Buffer.from(ilpPacket, 'base64'));
        expect(json).toBeTruthy();
    });

    describe('Ilp Packet Serialize tests -->', () => {
        const createIlpJson = (amount) => ({
            amount,
            data: Buffer.from('data'),
            destination: ILP_ADDRESS,
            expiresAt: new Date(),
            executionCondition: Buffer.alloc(32, 'x'),
        });
        const serialize = json => IlpPacket.serializeIlpPrepare(json);

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
            const condition = ilp._sha256('preimage');
            const packetInput = ilp.makeQuotePacketInput(fxQuote, condition);
            const packet = serialize(packetInput);
            expect(Buffer.isBuffer(packet)).toBe(true);
        });
    });

    describe('Ilp Packet Decoding and Validation -->', () => {
        let ilpCombo;

        beforeEach(() => {
            ilpCombo = ilp.getQuoteResponseIlp(quoteRequest, partialResponse);
            transferRequest.ilpPacket = ilpCombo.ilpPacket;
            transferRequest.condition = ilpCombo.condition;
        });

        test('Should decode the IlpPacket', () => {
            const decodedIlp = ilp.decodeIlpPacket(ilpCombo.ilpPacket);

            expect(decodedIlp).toBeTruthy();
            expect(decodedIlp.amount).toBe(ilp._getIlpCurrencyAmount(partialResponse.transferAmount));
            expect(decodedIlp.data).toBeInstanceOf(Buffer);
            expect(decodedIlp.destination).toBe(ILP_ADDRESS);
            expect(decodedIlp.expiresAt).toBeInstanceOf(Date);
            expect(decodedIlp.executionCondition).toBeInstanceOf(Buffer);
        });

        test('Should generate transaction object from an Ilp packet', () => {
            const transaction = ilp.getTransactionObject(ilpCombo.ilpPacket);

            expect(transaction).toBeTruthy();
            expect(transaction.quoteId).toBe(quoteRequest.quoteId);
            expect(transaction.transactionId).toBe(quoteRequest.transactionId);
            expect(transaction.transactionType).toEqual(quoteRequest.transactionType);
            expect(transaction.payee).toEqual(quoteRequest.payee);
            expect(transaction.payer).toEqual(quoteRequest.payer);
            expect(transaction.amount).toEqual(partialResponse.transferAmount);
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



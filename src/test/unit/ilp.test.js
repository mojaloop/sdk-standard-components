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

const Ilp = require('../../lib/ilp');
const IlpPacket = require('ilp-packet');

const quoteRequest = require('./data/quoteRequest');
const partialResponse = require('./data/partialResponse');
const mockLogger = require('../__mocks__/mockLogger');

describe('ILP', () => {
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
        const expectedDataElement = {
            // Not all elements from quoteRequest end up in the ilp packet
            amount: {
                amount: '500',
                currency: 'USD'
            },
            payee: quoteRequest.payee,
            payer: quoteRequest.payer,
            transactionType: quoteRequest.transactionType,
            quoteId: quoteRequest.quoteId,
            transactionId: quoteRequest.transactionId,
        };

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
});

describe('Ilp Packet Decoding and Validation', () => {
    let ilp;
    let ilpCombo;
    const transferRequest = require('./data/transferRequest');

    beforeEach(() => {
        ilp = new Ilp({
            secret: 'test',
            logger: mockLogger({ app: 'ilp-packet-test' })
        });
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

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

const util = require('util');
const test = require('ava');
const Ilp = require('../lib/ilp');
const IlpPacket = require('ilp-packet'); 


const quoteRequest = {
    quoteId: '20508186-1458-4ac0-a824-d4b07e37d7b3',
    transactionId: '20508186-1458-4ac0-a824-d4b07e37d7b3',
    payee: {
        partyIdInfo: {
            partyIdType: 'MSISDN',
            partyIdentifier: '123456789',
            fspId: 'MobileMoney'
        }
    },
    payer: {
        personalInfo: {
            complexName: {
                firstName: 'Mats',
                lastName: 'Hagman'
            }
        },
        partyIdInfo: {
            partyIdType: 'MSISDN',
            partyIdentifier: '9876543',
            fspId: 'BankNrOne'
        }
    },
    amountType: 'RECEIVE',
    amount: {
        amount: '100',
        currency: 'USD'
    },
    transactionType: {
        scenario: 'TRANSFER',
        initiator: 'PAYER',
        initiatorType: 'CONSUMER',
        balanceOfPayments: '110'
    },
    geoCode: {
        latitude: '52.295971',
        longitude: '-0.038400'
    },
    note: 'From Mats',
    expiration: '2017-11-15T22:17:28.985-01:00'
};

const partialResponse = {
    transferAmount: {
        amount: '500',
        currency: 'USD'
    },
    payeeReceiveAmount: {
        amount: '490',
        currency: 'USD'
    },
    payeeFspFee: {
        amount: '5',
        currency: 'USD'
    },
    payeeFspCommission: {
        amount: '5',
        currency: 'USD'
    },
    geoCode: {
        latitude: '53.295971',
        longitude: '-0.038500'
    },
    expiration: '2017-11-15T14:17:09.663+01:00'
};

test.beforeEach(t => {
    t.context = {
        ilp: new Ilp({ secret: 'test' })
    };
});


test('Should generate ILP components for a quote response given a quote request and partial response', t => {
    const {
        fulfilment,
        ilpPacket,
        condition
    } = t.context.ilp.getQuoteResponseIlp(quoteRequest, partialResponse);

    if(!fulfilment) {
        return t.fail();
    }
    if(!ilpPacket) {
        return t.fail();
    }
    if(!condition) {
        return t.fail();
    }

    t.pass();
});


test('ILP packet should contain a valid transaction object', t => {
    try {
        const { ilpPacket } = t.context.ilp.getQuoteResponseIlp(quoteRequest, partialResponse);

        const binaryPacket = Buffer.from(ilpPacket, 'base64');
        const jsonPacket = IlpPacket.deserializeIlpPacket(binaryPacket);
        console.log(`Decoded ILP packet: ${util.inspect(jsonPacket)}`);

        const dataElement = JSON.parse(Buffer.from(jsonPacket.data.data.toString('utf8'), 'base64').toString('utf8'));

        console.log(`Decoded ILP packet data element: ${util.inspect(dataElement)}`);

        t.pass();
    }
    catch(e) {
        t.fail();
    }
});


test('ILP fulfilment should match condition', t => {
    try {
        const { fulfilment, ilpPacket, condition } = t.context.ilp.getQuoteResponseIlp(quoteRequest, partialResponse);

        const binaryPacket = Buffer.from(ilpPacket, 'base64');
        const jsonPacket = IlpPacket.deserializeIlpPacket(binaryPacket);
        console.log(`Decoded ILP packet: ${util.inspect(jsonPacket)}`);

        const dataElement = JSON.parse(Buffer.from(jsonPacket.data.data.toString('utf8'), 'base64').toString('utf8'));

        console.log(`Decoded ILP packet data element: ${util.inspect(dataElement)}`);

        const valid = t.context.ilp.validateFulfil(fulfilment, condition);

        console.log(`Valudate fulfilment returned ${valid}`);

        if(!valid) {
            t.fail();
        }

        t.pass();
    }
    catch(e) {
        t.fail();
    }
});

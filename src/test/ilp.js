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

const quoteRequest = require('./data/quoteRequest');
const partialResponse = require('./data/partialResponse');

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

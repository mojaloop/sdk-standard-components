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

//const ilp = require('ilp-packet');
const Crypto = require('crypto');
const base64url = require('base64url');

// outstanding issue with ILP v1 compatibility 
// const ilpPacket = require('ilp-packet');


/**
 * An abstraction of ILP suitable for the Mojaloop API ILP requirements
 */
class Ilp {
    constructor(config) {
        this.secret = config.secret;
        this.logger = config.logger || console;
    }

    
    /**
     * Generates the required fulfilment, ilpPacket and condition for a quote response 
     *
     * @returns {object} - object containing the fulfilment, ilp packet and condition values
     */
    getQuoteResponseIlp(quoteResponse) {
        const transactionObject = {
            transactionId: quoteResponse.transactionId,
            quoteId: quoteResponse.quoteId,
            payee: quoteResponse.payee,
            payer: quoteResponse.payer,
            amount: quoteResponse.amount,
            transactionType: quoteResponse.transactionType,
            note: quoteResponse.note
        };

        const ilpPacket = Buffer.from(JSON.stringify(transactionObject));

        let base64encodedIlpPacket = ilpPacket.toString('base64');

        let generatedFulfilment = this.caluclateFulfil(base64encodedIlpPacket);
        let generatedCondition = this.calculateConditionFromFulfil(generatedFulfilment);

        return {
            fulfilment: generatedFulfilment,
            ilpPacket: base64encodedIlpPacket,
            condition: generatedCondition
        };
    }


    /**
     * Validates a fulfilment against a condition
     *
     * @returns {boolean} - true is the fulfilment is valid, otherwise false
     */
    validateFulfil(fulfilment, condition) {
        let preimage = base64url.toBuffer(fulfilment);

        if (preimage.length !== 32) {
            return false;
        }

        let calculatedConditionDigest = this._sha256(preimage);
        let calculatedConditionUrlEncoded = base64url.fromBase64(calculatedConditionDigest);

        return (calculatedConditionUrlEncoded === condition);
    }


    /**
     * Calculates a fulfilment given a base64 encoded ilp packet and a secret
     *
     * @returns {string} - string containing base64 encoded fulfilment
     */
    caluclateFulfil(base64EncodedPacket) {
        var encodedSecret = Buffer.from(this.secret).toString('base64');

        var hmacsignature = Crypto.createHmac('sha256', new Buffer(encodedSecret, 'ascii'))
            .update(new Buffer(base64EncodedPacket, 'ascii'));

        var generatedFulfilment = hmacsignature.digest('base64');

        this.logger.log(`ILP: caluclated fulfil: generatedFulfilment=${generatedFulfilment} length: ${generatedFulfilment.length}`);

        return base64url.fromBase64(generatedFulfilment);
    }


    /**
     * Calculates a condition from a fulfilment
     *
     * @returns {string} - base64 encoded condition calculated from supplied fulfilment
     */
    calculateConditionFromFulfil (fulfilment) {
        var preimage = base64url.toBuffer(fulfilment);
        
        if (preimage.length !== 32) {
            throw new Error('Interledger preimages must be exactly 32 bytes.');
        }
        
        var calculatedConditionDigest = this._sha256(preimage);
        this.logger.log(`ILP: calculated condition digest: ${calculatedConditionDigest}`);
        return base64url.fromBase64(calculatedConditionDigest);
    }

    _sha256 (preimage) {
        return Crypto.createHash('sha256').update(preimage).digest('base64');
    }
}


module.exports = Ilp;

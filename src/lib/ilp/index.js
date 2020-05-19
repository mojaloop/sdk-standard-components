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
const Crypto = require('crypto');
const base64url = require('base64url');

// must be pinned at ilp-packet@2.2.0 for ILP v1 compatibility
const ilpPacket = require('ilp-packet');

// currency decimal place data
const currencyDecimals = require('./currency.json');


/**
 * An abstraction of ILP suitable for the Mojaloop API ILP requirements
 */
class Ilp {
    constructor(config) {
        this.secret = config.secret;
        this.logger = config.logger || console;
    }

    /**
     * Generates the required fulfilment, ilpPacket and condition
     *
     * @returns {object} - object containing the fulfilment, ilp packet and condition values
     */
    getResponseIlp(transactionObject) {
        const ilpData = Buffer.from(base64url(JSON.stringify(transactionObject)));
        const packetInput = {
            amount: this._getIlpCurrencyAmount(transactionObject.amount), // unsigned 64bit integer as a string
            account: this._getIlpAddress(transactionObject.payee), // ilp address
            data: ilpData // base64url encoded attached data
        };

        const packet = ilpPacket.serializeIlpPayment(packetInput);

        let base64encodedIlpPacket = base64url.fromBase64(packet.toString('base64')).replace('"', '');

        let generatedFulfilment = this.calculateFulfil(base64encodedIlpPacket).replace('"', '');
        let generatedCondition = this.calculateConditionFromFulfil(generatedFulfilment).replace('"', '');

        const ret = {
            fulfilment: generatedFulfilment,
            ilpPacket: base64encodedIlpPacket,
            condition: generatedCondition
        };

        this.logger.log(`Generated ILP: transaction object: ${util.inspect(transactionObject)}\nPacket input: ${util.inspect(packetInput)}\nOutput: ${util.inspect(ret)}`);

        return ret;
    }


    /**
     * Generates the required fulfilment, ilpPacket and condition for a quote response
     *
     * @returns {object} - object containing the fulfilment, ilp packet and condition values
     */
    getQuoteResponseIlp(quoteRequest, quoteResponse) {
        return this.getResponseIlp({
            transactionId: quoteRequest.transactionId,
            quoteId: quoteRequest.quoteId,
            payee: quoteRequest.payee,
            payer: quoteRequest.payer,
            amount: quoteResponse.transferAmount,
            transactionType: quoteRequest.transactionType,
            note: quoteResponse.note
        });
    }

    /**
     * Returns an ILP compatible amount as an unsigned 64bit integer as a string given a mojaloop
     * API spec amount object. Note that this is achieved by multiplying the amount by 10 ^ number
     * of decimal places.
     *
     * @returns {string} - unsigned 64bit integer as string
     */
    _getIlpCurrencyAmount(mojaloopAmount) {
        const { currency, amount } = mojaloopAmount;

        if(typeof(currencyDecimals[currency]) === 'undefined') {
            throw new Error(`No decimal place data available for currency ${currency}`);
        }

        const decimalPlaces = currencyDecimals[currency];
        return `${Number(amount) * Math.pow(10, decimalPlaces)}`;
    }


    /**
     * Returns an ILP compatible address string given a mojaloop API spec party object.
     * Note that this consists of 4 parts:
     *  1. ILP address allocation scheme identifier (always the global allocation scheme)
     *  2. FSPID of the DFSP owning the party account
     *  3. Identifier type being used to identify the account
     *  4. Identifier of the account
     *
     * @returns {string} - ILP address of the specified party
     */
    _getIlpAddress(mojaloopParty) {
        // validate input
        if (!mojaloopParty || typeof(mojaloopParty) !== 'object') {
            throw new Error('ILP party must be an objcet');
        }

        const { partyIdInfo } = mojaloopParty;

        if (!partyIdInfo || typeof(partyIdInfo) !== 'object') {
            throw new Error('ILP party does not contain required partyIdInfo object');
        }

        const { fspId, partyIdType, partyIdentifier, partySubIdOrType } = partyIdInfo;
        if (!partyIdType || typeof(partyIdType) !== 'string') {
            throw new Error('ILP party does not contain required partyIdInfo.partyIdType string value');
        }
        if (!partyIdentifier || typeof(partyIdType) !== 'string') {
            throw new Error('ILP party does not contain required partyIdInfo.partyIdentifier string value');
        }
        if (partySubIdOrType !== undefined && typeof(partySubIdOrType) !== 'string') {
            throw new Error('ILP party partyIdInfo.partySubIdOrType should be a string value');
        }

        return 'g' // ILP global address allocation scheme
            + `.${fspId}` // fspId of the party account
            + `.${partyIdType.toLowerCase()}` // identifier type
            + `.${partyIdentifier.toLowerCase()}` // identifier value
            + (partySubIdOrType ? `.${partySubIdOrType.toLowerCase()}` : '');
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
    calculateFulfil(base64EncodedPacket) {
        var encodedSecret = Buffer.from(this.secret).toString('base64');

        var hmacsignature = Crypto.createHmac('sha256', new Buffer(encodedSecret, 'ascii'))
            .update(new Buffer(base64EncodedPacket, 'ascii'));

        var generatedFulfilment = hmacsignature.digest('base64');

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
        return base64url.fromBase64(calculatedConditionDigest);
    }

    _sha256 (preimage) {
        return Crypto.createHash('sha256').update(preimage).digest('base64');
    }

    /**
     * Decodes an Ilp Packet
     *
     * @returns {object} - Ilp packet as JSON object
     */
    decodeIlpPacket (inputIlpPacket) {
        const binaryPacket = Buffer.from(inputIlpPacket, 'base64');
        const jsonPacket = ilpPacket.deserializeIlpPayment(binaryPacket);
        return jsonPacket;
    }
    
    /**
     * Get the transaction object in the data field of an Ilp packet
     *
     * @returns {object} - Transaction Object
     */
    getTransactionObject (inputIlpPacket) {
        const jsonPacket = this.decodeIlpPacket(inputIlpPacket);
        const decodedData = base64url.decode(jsonPacket.data.toString());
        return JSON.parse(decodedData);
    }
    
    /**
     * Validate the transfer request against the decoded Ilp packet in it
     *
     * @returns {boolean} - True if the content in the transaction request is valid for Ilp packet
     */
    validateIlpAgainstTransferRequest (transferRequestBody) {
        const transactionObject = this.getTransactionObject(transferRequestBody.ilpPacket);

        if (transferRequestBody.payerFsp !== transactionObject.payer.partyIdInfo.fspId) {
            return false;
        }
        if (transferRequestBody.payeeFsp !== transactionObject.payee.partyIdInfo.fspId) {
            return false;
        }
        if (transferRequestBody.amount.currency !== transactionObject.amount.currency) {
            return false;
        }
        if (transferRequestBody.amount.amount !== transactionObject.amount.amount) {
            return false;
        }
        return true;
    }

}



module.exports = Ilp;

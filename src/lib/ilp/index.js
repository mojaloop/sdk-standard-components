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

const { Buffer } = require('node:buffer');
const crypto = require('node:crypto');
const base64url = require('base64url');
const safeStringify = require('fast-safe-stringify');
const ilpPacket = require('ilp-packet');

const dto = require('../dto');
const { ILP_ADDRESS, ILP_AMOUNT_FOR_FX, ERROR_MESSAGES } = require('../constants');

// currency decimal place data
const currencyDecimals = require('./currency.json');

const HASH_ALGORITHM = 'sha256';
const DIGEST_ENCODING = 'base64url';


/**
 * An abstraction of ILP suitable for the Mojaloop API ILP requirements
 */
class Ilp {
    constructor(config) {
        this.secret = config.secret;
        this.logger = config.logger;
    }

    /**
     * Generates the required fulfilment, condition, and ilpPacket
     *
     * @returns {object} - object containing the fulfilment, ilp packet and condition values
     */
    getResponseIlp(transactionObject) {
        const fulfilment = this.calculateFulfil(transactionObject);
        const condition = this.calculateConditionFromFulfil(fulfilment);
        const ilpPacket = this.calculateIlpPacket(transactionObject, condition);

        const result = {
            fulfilment,
            condition,
            ilpPacket
        };
        this.logger.isDebugEnabled && this.logger.push({ transactionObject, result }).debug('Generated ILP response');

        return result;
    }


    /**
     * Generates the required fulfilment, ilpPacket and condition for a quote response
     *
     * @returns {object} - object containing the fulfilment, ilp packet and condition values
     */
    getQuoteResponseIlp(quoteRequest, quoteResponse) {
        const transactionObject = dto.transactionObjectDto(quoteRequest, quoteResponse);
        return this.getResponseIlp(transactionObject);
    }


    /**
     * Generates the required fulfilment, ilpPacket and condition for a fxQuote response
     *
     * @returns {object} - object containing the fulfilment, ilp packet and condition values
     */
    getFxQuoteResponseIlp(fxQuoteRequest, beFxQuoteResponse) {
        const { conversionRequestId } = fxQuoteRequest;
        const { conversionTerms } = beFxQuoteResponse;
        const fxTransactionObject = {
            conversionRequestId,
            conversionTerms
        };

        return this.getResponseIlp(fxTransactionObject);
    }

    /**
     * Generates a JSON payload for ILPv4 (IlpPrepare)
     *
     * @param {Object} transactionObject The body of the consent object
     * @param {String} condition base64 encoded SHA-256 hash digest of the fulfillment
     *
     * @returns {Object} ILPv4 JSON payload
     */
    makeQuotePacketInput(transactionObject, condition) {
        const isFx = !!transactionObject.conversionTerms;

        const expiresAt = isFx
            ? new Date(transactionObject.conversionTerms.expiration)
            : new Date(transactionObject.expiration);
        if (isNaN(expiresAt.getTime())){
            throw new TypeError(ERROR_MESSAGES.invalidIlpExpirationDate);
        }
        const amount = isFx
            ? ILP_AMOUNT_FOR_FX
            : this._getIlpCurrencyAmount(transactionObject.amount);
        const destination = this._getIlpAddress();

        this.logger.isDebugEnabled && this.logger.push({ transactionObject, amount, expiresAt, destination }).debug('ILP packet input details');

        return Object.freeze({
            amount, // unsigned 64bit integer as a string
            destination, // ilp address
            expiresAt,
            executionCondition: Buffer.from(condition, 'base64'),
            data: this.makeIlpData(transactionObject) // base64url encoded attached data
        });
    }

    makeIlpData(transactionObject) {
        // todo: think, if we need to add condition (or another info) to the ILP data
        return Buffer.from(base64url(safeStringify(transactionObject)));
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

        if (typeof currencyDecimals[currency] === 'undefined') {
            throw new Error(`No decimal place data available for currency ${currency}`);
        }

        const decimalPlaces = currencyDecimals[currency];
        return `${Number(amount) * Math.pow(10, decimalPlaces)}`;
    }


    /**
     * Returns an ILP compatible address string.
     *
     * Note that we are not able to set the account in the way that ILP expect it to be set.
     *    This is because Mojaloop uses party identifiers instead. So setting it would be misleading.
     *
     * @returns {string} - dummy ILP address for mojaloop
     */
    _getIlpAddress() {
        return ILP_ADDRESS;
    }

    /**
     * Validates a fulfilment against a condition
     *
     * @returns {boolean} - true is the fulfilment is valid, otherwise false
     */
    validateFulfil(fulfilment, condition) {
        const preimage = base64url.toBuffer(fulfilment);

        if (preimage.length !== 32) {
            return false;
        }
        const calculatedConditionUrlEncoded = this._sha256(preimage);

        return (calculatedConditionUrlEncoded === condition);
    }


    /**
     * Calculates a fulfilment given a transaction object and a secret
     *
     * @returns {string} - string containing base64 encoded fulfilment
     */
    calculateFulfil(transactionObject) {
        const base64EncodedTransaction = Buffer.from(safeStringify(transactionObject)).toString('base64');
        const encodedSecret = Buffer.from(this.secret).toString('base64');

        return crypto.createHmac(HASH_ALGORITHM, Buffer.from(encodedSecret, 'ascii'))
            .update(Buffer.from(base64EncodedTransaction, 'ascii'))
            .digest(DIGEST_ENCODING);
    }


    /**
     * Calculates a condition from a fulfilment
     *
     * @returns {string} - base64 encoded condition calculated from supplied fulfilment
     */
    calculateConditionFromFulfil (fulfilment) {
        const preimage = base64url.toBuffer(fulfilment);

        if (preimage.length !== 32) {
            throw new Error('Interledger preimages must be exactly 32 bytes.');
        }

        return this._sha256(preimage);
    }

    calculateIlpPacket (transactionObject, condition) {
        const packetInput = this.makeQuotePacketInput(transactionObject, condition);
        const packet = ilpPacket.serializeIlpPrepare(packetInput);

        return base64url.fromBase64(packet.toString('base64'));
    }

    /**
     * Decodes an Ilp Packet
     *
     * @returns {object} - Ilp packet as JSON object
     */
    decodeIlpPacket (inputIlpPacket) {
        const binaryPacket = Buffer.from(inputIlpPacket, 'base64');
        return ilpPacket.deserializeIlpPrepare(binaryPacket);
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

    _sha256 (preimage) {
        return crypto.createHash(HASH_ALGORITHM)
            .update(preimage)
            .digest(DIGEST_ENCODING);
    }
}

module.exports = Ilp;

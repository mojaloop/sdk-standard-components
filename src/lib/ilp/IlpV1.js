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

const base64url = require('base64url');
const safeStringify = require('fast-safe-stringify');

// must be pinned at ilp-packet@2.2.0 for ILP v1 compatibility
const ilpPacket = require('ilp-packet-v1');
const { ILP_AMOUNT_FOR_FX } = require('../constants');
const IlpBase = require('./IlpBase');

/**
 * An abstraction of ILP suitable for the Mojaloop API ILP requirements
 */
class IlpV1 extends IlpBase {

    /**
     * Generates the required fulfilment, condition, and ilpPacket
     *
     * @returns {IlpResponse} - object containing the fulfilment, condition and ilp packet (v1)
     */
    getResponseIlp(transactionObject) {
        const packetInput = this.makeQuotePacketInput(transactionObject);
        const packet = ilpPacket.serializeIlpPayment(packetInput);

        let base64encodedIlpPacket = base64url.fromBase64(packet.toString('base64')).replace('"', '');

        let generatedFulfilment = this.calculateFulfil(base64encodedIlpPacket).replace('"', '');
        let generatedCondition = super.calculateConditionFromFulfil(generatedFulfilment).replace('"', '');

        const ret = {
            fulfilment: generatedFulfilment,
            ilpPacket: base64encodedIlpPacket,
            condition: generatedCondition
        };

        this.logger.isDebugEnabled && this.logger.debug(`Generated ILP: transaction object: ${safeStringify(transactionObject)}\nPacket input: ${safeStringify(packetInput)}\nOutput: ${safeStringify(ret)}`);

        return ret;
    }


    /**
     * @typedef {Object} IlpInputV1
     *
     * @property {String} amount - Transfer amount.
     * @property {String} account - ILP Address of the receiver.
     * @property {Buffer} data - transactionObject data.
     */
    /**
     * Generates a JSON payload for ILPv1 (IlpPayment)
     *
     * @param {Object} transactionObject The body of the consent object
     *
     * @returns {IlpInputV1} ILPv1 JSON payload
     */
    makeQuotePacketInput(transactionObject) {
        const isFx = !!transactionObject.conversionTerms;

        const amount = isFx
            ? ILP_AMOUNT_FOR_FX
            : super._getIlpCurrencyAmount(transactionObject.amount);
        const account = isFx
            ? this._getFxIlpAddress(transactionObject.conversionTerms) // ilp address
            : this._getIlpAddress(transactionObject.payee);

        return Object.freeze({
            data: super.makeIlpData(transactionObject), // base64url encoded attached data
            amount, // unsigned 64bit integer as a string
            account // ilp address
        });
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

    _getFxIlpAddress(conversionTerms) {
        const { counterPartyFsp, sourceAmount, targetAmount } = conversionTerms;
        return `g.${counterPartyFsp.toLowerCase()}.${sourceAmount.currency.toLowerCase()}.${targetAmount.currency.toLowerCase()}`;
    }


    /**
     * Calculates a fulfilment given a base64 encoded ilp packet and a secret
     *
     * @returns {string} - string containing base64 encoded fulfilment
     */
    calculateFulfil(base64EncodedPacket) {
        const encodedSecret = Buffer.from(this.secret).toString('base64');
        return super._createHmac(base64EncodedPacket, encodedSecret);
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
}

module.exports = IlpV1;

/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 * ModusBox
 - James Bush - james.bush@modusbox.com - ORIGINAL AUTHOR

 --------------
 ******/

'use strict';

const base64url = require('base64url');

// must be pinned at ilp-packet@2.2.0 for ILP v1 compatibility
const ilpPacket = require('ilp-packet-v1');
const { ILP_AMOUNT_FOR_FX, ILP_VERSIONS } = require('../constants');
const IlpBase = require('./IlpBase');

/**
 * An abstraction of ILP suitable for the Mojaloop API ILP requirements
 */
class IlpV1 extends IlpBase {
    get version () { return ILP_VERSIONS.v1; }

    /**
     * Generates the required fulfilment, condition, and ilpPacket
     *
     * @returns {IlpResponse} - object containing the fulfilment, condition and ilp packet (v1)
     */
    getResponseIlp (transactionObject) {
        const packetInput = this.makeQuotePacketInput(transactionObject);
        const packet = ilpPacket.serializeIlpPayment(packetInput);

        const base64encodedIlpPacket = base64url.fromBase64(packet.toString('base64')).replace('"', '');

        const generatedFulfilment = this.calculateFulfil(base64encodedIlpPacket).replace('"', '');
        const generatedCondition = super.calculateConditionFromFulfil(generatedFulfilment).replace('"', '');

        const result = {
            fulfilment: generatedFulfilment,
            condition: generatedCondition,
            ilpPacket: base64encodedIlpPacket
        };

        this.logger.debug('Generated ILP v1 response:', {
            transactionObject, result, packetInput: { ...packetInput, data: 'Buffer...' }
        });

        return result;
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
    makeQuotePacketInput (transactionObject) {
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
    _getIlpAddress (mojaloopParty) {
    // validate input
        if (!mojaloopParty || typeof (mojaloopParty) !== 'object') {
            throw new Error('ILP party must be an objcet');
        }

        const { partyIdInfo } = mojaloopParty;

        if (!partyIdInfo || typeof (partyIdInfo) !== 'object') {
            throw new Error('ILP party does not contain required partyIdInfo object');
        }

        const { fspId, partyIdType, partyIdentifier, partySubIdOrType } = partyIdInfo;
        if (!partyIdType || typeof (partyIdType) !== 'string') {
            throw new Error('ILP party does not contain required partyIdInfo.partyIdType string value');
        }
        if (!partyIdentifier || typeof (partyIdType) !== 'string') {
            throw new Error('ILP party does not contain required partyIdInfo.partyIdentifier string value');
        }
        if (partySubIdOrType !== undefined && typeof (partySubIdOrType) !== 'string') {
            throw new Error('ILP party partyIdInfo.partySubIdOrType should be a string value');
        }

        return 'g' + // ILP global address allocation scheme
            `.${fspId}` + // fspId of the party account
            `.${partyIdType.toLowerCase()}` + // identifier type
            `.${partyIdentifier.toLowerCase()}` + // identifier value
            (partySubIdOrType ? `.${partySubIdOrType.toLowerCase()}` : '');
    }

    _getFxIlpAddress (conversionTerms) {
        const { counterPartyFsp, sourceAmount, targetAmount } = conversionTerms;
        return `g.${counterPartyFsp.toLowerCase()}.${sourceAmount.currency.toLowerCase()}.${targetAmount.currency.toLowerCase()}`;
    }

    /**
     * Calculates a fulfilment given a base64 encoded ilp packet and a secret
     *
     * @returns {string} - string containing base64 encoded fulfilment
     */
    calculateFulfil (base64EncodedPacket) {
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

/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Eugen Klymniuk <eugen.klymniuk@infitx.com>
 --------------
 **********/

const { Buffer } = require('node:buffer');
const base64url = require('base64url');
const ilpPacket = require('ilp-packet');
const safeStringify = require('fast-safe-stringify');

const { ILP_ADDRESS, ILP_AMOUNT_FOR_FX, ILP_VERSIONS, ERROR_MESSAGES } = require('../constants');
const IlpBase = require('./IlpBase');

/**
 * An abstraction of ILP suitable for the Mojaloop API ILP requirements
 */
class IlpV4 extends IlpBase {
    get version() { return ILP_VERSIONS.v4; }

    /**
     * Generates the required fulfilment, condition, and ilpPacket
     *
     * @returns {IlpResponse} - object containing the fulfilment, condition and ilp packet (v4)
     */
    getResponseIlp(transactionObject) {
        const fulfilment = this.#calculateFulfilFromTransactionObject(transactionObject);
        const condition = super.calculateConditionFromFulfil(fulfilment);
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
     * Calculates a fulfilment given a base64 encoded ilp packet
     *
     * @returns {string} - string containing base64 encoded fulfilment
     */
    calculateFulfil(base64EncodedPacket) {
        const transactionObject = this.getTransactionObject(base64EncodedPacket);
        const { fulfilment } = this.getResponseIlp(transactionObject);
        return fulfilment;
    }

    /**
     * @typedef {Object} IlpInputV4
     * @prop {String} amount - Transfer amount.
     * @prop {String} destination - ILP Address of the receiver.
     * @prop {Date} expiresAt - Date and time when the packet expires.
     * @prop {String} executionCondition - SHA-256 hash digest of the fulfillment.
     * @prop {Buffer} data - transactionObject data.
     */
    /**
     * Generates a JSON payload for ILPv4 (IlpPrepare)
     *
     * @param {Object} transactionObject The body of the consent object
     * @param {String} condition base64 encoded SHA-256 hash digest of the fulfillment
     *
     * @returns {IlpInputV4} ILPv4 JSON payload
     */
    makeQuotePacketInput(transactionObject, condition) {
        const isFx = !!transactionObject.conversionTerms;

        const expiresAt = isFx
            ? new Date(transactionObject.conversionTerms.expiration)
            : new Date(transactionObject.expiration);
        if (isNaN(expiresAt.getTime())){
            throw new TypeError(ERROR_MESSAGES.invalidIlpExpirationDate);
        }
        const amount = this.#adjustAmount(transactionObject, isFx);
        const destination = this._getIlpAddress();

        this.logger.isDebugEnabled && this.logger.push({ transactionObject, amount, expiresAt, destination }).debug('ILP packet input details');

        return Object.freeze({
            amount, // unsigned 64bit integer as a string
            destination, // ilp address
            expiresAt,
            executionCondition: Buffer.from(condition, 'base64'),
            data: super.makeIlpData(transactionObject) // base64url encoded attached data
        });
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

    calculateIlpPacket(transactionObject, condition) {
        const packetInput = this.makeQuotePacketInput(transactionObject, condition);
        const packet = ilpPacket.serializeIlpPrepare(packetInput);

        return base64url.fromBase64(packet.toString('base64'));
    }

    /**
     * Decodes an Ilp Packet
     *
     * @returns {object} - Ilp packet as JSON object
     */
    decodeIlpPacket(inputIlpPacket) {
        const binaryPacket = Buffer.from(inputIlpPacket, 'base64');
        return ilpPacket.deserializeIlpPrepare(binaryPacket);
    }

    /**
     * Calculates a fulfilment given a transaction object and a secret
     *
     * @returns {string} - string containing base64 encoded fulfilment
     */
    #calculateFulfilFromTransactionObject(transactionObject) {
        const base64EncodedTransaction = Buffer.from(safeStringify(transactionObject)).toString('base64');
        const encodedSecret = Buffer.from(this.secret).toString('base64');

        return super._createHmac(base64EncodedTransaction, encodedSecret);
    }

    #adjustAmount(transactionObject, isFx) {
        const amount = isFx
            ? ILP_AMOUNT_FOR_FX
            : super._getIlpCurrencyAmount(transactionObject.amount);

        if (amount.includes('.')) {
            const errMessage = ERROR_MESSAGES.invalidAdjustedAmount;
            this.logger.push(transactionObject.amount).warn(errMessage);
            throw new TypeError(errMessage);
        }
        return amount;
    }
}

module.exports = IlpV4;

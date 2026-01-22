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

 * Eugen Klymniuk <eugen.klymniuk@infitx.com>
 --------------
 **********/

const { Buffer } = require('node:buffer');
const crypto = require('node:crypto');
const base64url = require('base64url');
const safeStringify = require('fast-safe-stringify');
const MLNumber = require('@mojaloop/ml-number');

const dto = require('../dto');

// currency decimal place data
const currencyDecimals = require('./currency.json');

const HASH_ALGORITHM = 'sha256';
const DIGEST_ENCODING = 'base64url';

/**
 * An abstraction of ILP suitable for the Mojaloop API ILP requirements
 */
class IlpBase {
    constructor (config) {
        this.secret = config.secret;
        this.logger = config.logger.child({ component: this.constructor.name });
    }

    get version () {
        throw new Error('Getter "version" should be overridden');
    }

    /**
     * @typedef {Object} IlpResponse
     * @property {string} fulfilment - fulfilment.
     * @property {string} condition - condition.
     * @property {string} ilpPacket - ilpPacket.
     */
    /**
     * Generates the required fulfilment, condition, and ilpPacket
     *
     * @returns {IlpResponse} - object containing the fulfilment, ilp packet and condition values
     */
    // eslint-disable-next-line no-unused-vars
    getResponseIlp (transactionObject) {
        throw new Error('getResponseIlp method should be overridden');
    }

    /**
     * Decodes an Ilp Packet
     *
     * @returns {object} - Ilp packet as JSON object
     */
    // eslint-disable-next-line no-unused-vars
    decodeIlpPacket (inputIlpPacket) {
        throw new Error('decodeIlpPacket method should be overridden');
    }

    /**
     * Generates the required fulfilment, ilpPacket and condition for a quote response
     *
     * @returns {IlpResponse} - object containing the fulfilment, ilp packet and condition values
     */
    getQuoteResponseIlp (quoteRequest, quoteResponse) {
        const transactionObject = dto.transactionObjectDto(quoteRequest, quoteResponse);
        return this.getResponseIlp(transactionObject);
    }

    /**
     * Generates the required fulfilment, ilpPacket and condition for a fxQuote response.
     *   Is used in sdk-scheme-adaptor in InboundTransfersModel.
     *
     * @returns {IlpResponse} - object containing the fulfilment, ilp packet and condition values
     */
    getFxQuoteResponseIlp (fxQuoteRequest, beFxQuoteResponse) {
        const { conversionRequestId } = fxQuoteRequest;
        const { conversionTerms } = beFxQuoteResponse;
        const fxTransactionObject = {
            conversionRequestId,
            conversionTerms
        };
        return this.getResponseIlp(fxTransactionObject);
    }

    makeIlpData (transactionObject) {
        return Buffer.from(base64url(safeStringify(transactionObject)));
    }

    /**
     * Returns an ILP compatible amount as an unsigned 64bit integer as a string given a mojaloop
     * API spec amount object. Note that this is achieved by multiplying the amount by 10 ^ number
     * of decimal places.
     *
     * @returns {string} - unsigned 64bit integer as string
     */
    _getIlpCurrencyAmount (mojaloopAmount) {
        const { currency, amount } = mojaloopAmount;

        if (typeof currencyDecimals[currency] === 'undefined') {
            throw new Error(`No decimal place data available for currency ${currency}`);
        }

        const decimalPlaces = currencyDecimals[currency];
        const mlNumber = new MLNumber(amount);
        return mlNumber.shiftedBy(decimalPlaces).toString();
    }

    /**
     * Validates a fulfilment against a condition
     *
     * @returns {boolean} - true is the fulfilment is valid, otherwise false
     */
    validateFulfil (fulfilment, condition) {
        const preimage = base64url.toBuffer(fulfilment);

        if (preimage.length !== 32) {
            return false;
        }
        const calculatedConditionUrlEncoded = this._sha256(preimage);

        return (calculatedConditionUrlEncoded === condition);
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

    _createHmac (dataInBase64, secretInBase64) {
        return crypto.createHmac(HASH_ALGORITHM, Buffer.from(secretInBase64, 'ascii'))
            .update(Buffer.from(dataInBase64, 'ascii'))
            .digest(DIGEST_ENCODING);
    }
}

module.exports = IlpBase;

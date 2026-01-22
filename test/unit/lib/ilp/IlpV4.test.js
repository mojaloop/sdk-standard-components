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

const IlpPacket = require('ilp-packet');
const { ilpFactory, ILP_VERSIONS } = require('#src/lib/ilp/index');
const { ILP_ADDRESS, ILP_AMOUNT_FOR_FX, ERROR_MESSAGES } = require('#src/lib/constants');
const dto = require('#src/lib/dto');
const currencyJson = require('../../../../src/lib/ilp/currency');

const mockLogger = require('#test/__mocks__/mockLogger');
const fixtures = require('#test/fixtures');
const quoteRequest = require('../../../unit/data/quoteRequest');
const partialResponse = require('../../../unit/data/partialResponse');
const transferRequest = require('../../../unit/data/transferRequest');

describe('IlpV4 Tests -->', () => {
    let ilp;

    beforeEach(() => {
        ilp = ilpFactory(ILP_VERSIONS.v4, {
            secret: 'test',
            logger: mockLogger({ app: 'ilp-test-v4' })
        });
    });

    test('should have getter "version" (v4)', () => {
        expect(ilp.version).toBe(ILP_VERSIONS.v4);
    });

    test('should generate ILP components for a quote response given a quote request and partial response', () => {
        const {
            fulfilment,
            ilpPacket,
            condition
        } = ilp.getQuoteResponseIlp(quoteRequest, partialResponse);

        expect(fulfilment).toBeTruthy();
        expect(ilpPacket).toBeTruthy();
        expect(condition).toBeTruthy();
    });

    test('should generate ILP v4 components for fxQuote request and partial response', () => {
        const fxQuotesRequest = fixtures.fxQuotesPayload();
        const beResponse = fixtures.fxQuotesBeResponse(fxQuotesRequest);

        const {
            fulfilment,
            ilpPacket,
            condition
        } = ilp.getFxQuoteResponseIlp(fxQuotesRequest, beResponse);

        expect(fulfilment).toBeTruthy();
        expect(ilpPacket).toBeTruthy();
        expect(condition).toBeTruthy();
    });

    test('deserializes the ILP packet into a valid transaction object', () => {
    // Arrange
        const { ilpPacket } = ilp.getQuoteResponseIlp(quoteRequest, partialResponse);
        const transaction = dto.transactionObjectDto(quoteRequest, partialResponse);

        // Act
        const binaryPacket = Buffer.from(ilpPacket, 'base64');
        const jsonPacket = IlpPacket.deserializeIlpPacket(binaryPacket);
        const dataElement = JSON.parse(Buffer.from(jsonPacket.data.data.toString('utf8'), 'base64').toString('utf8'));

        // Assert
        expect(dataElement).toStrictEqual(transaction);
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
        expect(valid).toBe(true);
        // We just test that the JSON parsed correctly here - we don't test the format here
        expect(dataElement).toBeDefined();
    });

    test('should throw error if expiration in transactionObject is undefined', () => {
        const transactionObj = {
            expiration: undefined,
            amount: fixtures.moneyPayload()
        };
        const condition = ilp._sha256('preimage');
        expect(() => ilp.calculateIlpPacket(transactionObj, condition))
            .toThrow(ERROR_MESSAGES.invalidIlpExpirationDate);
    });

    test('should generate fulfilment, condition and ilpPacket (prepare) using shared method "getResponseIlp"', () => {
        const transactionObj = dto.transactionObjectDto(quoteRequest, partialResponse);
        const { fulfilment, condition, ilpPacket } = ilp.getResponseIlp(transactionObj);
        expect(fulfilment).toBeTruthy();
        expect(condition).toBeTruthy();
        expect(ilpPacket).toBeTruthy();

        const json = IlpPacket.deserializeIlpPrepare(Buffer.from(ilpPacket, 'base64'));
        expect(json).toBeTruthy();
    });

    test('should calculate fulfilment based on ilpPacket sting', () => {
        const transactionObj = dto.transactionObjectDto(quoteRequest, partialResponse);
        const ilpCombo = ilp.getResponseIlp(transactionObj);

        const fulfilment = ilp.calculateFulfil(ilpCombo.ilpPacket);
        expect(fulfilment).toBe(ilpCombo.fulfilment);
    });

    describe('calculateIlpPacket Method Tests', () => {
        const currency = 'XXX';
        const scale = currencyJson[currency];

        test('should calculate ilp packet from transaction object and condition', () => {
            const transactionObj = dto.transactionObjectDto(quoteRequest, partialResponse);
            const condition = ilp._sha256('preimage');
            const ilpPacket = ilp.calculateIlpPacket(transactionObj, condition);
            expect(ilpPacket).toBeTruthy();
        });

        test('should have scale for test currency', () => {
            expect(scale).toBeDefined();
        });

        test('should calculate ilp packet with amount with up to 4 decimals for test currency', () => {
            const amount = fixtures.moneyPayload({
                amount: `1000.${'1'.repeat(scale)}`,
                currency
            });
            const transactionObj = {
                ...dto.transactionObjectDto(quoteRequest, partialResponse),
                amount
            };
            const condition = ilp._sha256('preimage');
            const ilpPacket = ilp.calculateIlpPacket(transactionObj, condition);
            expect(ilpPacket).toBeTruthy();
        });

        test('should throw error on amount with more than defined scale decimals for test currency', () => {
            const amount = fixtures.moneyPayload({
                amount: `2000.${'2'.repeat(scale + 1)}`,
                currency
            });
            const transactionObj = {
                ...dto.transactionObjectDto(quoteRequest, partialResponse),
                amount
            };
            const condition = ilp._sha256('preimage');
            expect(() => ilp.calculateIlpPacket(transactionObj, condition))
                .toThrow(TypeError(ERROR_MESSAGES.invalidAdjustedAmount));
        });
    });

    describe('Ilp Packet Serialize Tests -->', () => {
        const createIlpJson = (amount) => ({
            amount,
            data: Buffer.from('data'),
            destination: ILP_ADDRESS,
            expiresAt: new Date(),
            executionCondition: Buffer.alloc(32, 'x')
        });
        const serialize = json => IlpPacket.serializeIlpPrepare(json);

        test('should throw error if amount as empty string in ilp packet', () => {
            const amount = '';
            expect(() => serialize(createIlpJson(amount)))
                .toThrow();
        });

        test('should be able to use ILP_AMOUNT_FOR_FX ("0") as amount in ilp packet', () => {
            const amount = ILP_AMOUNT_FOR_FX;
            const packet = serialize(createIlpJson(amount));
            expect(Buffer.isBuffer(packet)).toBe(true);
        });

        test('should create ilp packet for fxQuote', () => {
            const fxQuote = fixtures.fxQuotesPayload();
            const condition = ilp._sha256('preimage');
            const packetInput = ilp.makeQuotePacketInput(fxQuote, condition);
            const packet = serialize(packetInput);
            expect(Buffer.isBuffer(packet)).toBe(true);
        });
    });

    describe('Ilp Packet Decoding and Validation -->', () => {
        let ilpCombo;

        beforeEach(() => {
            ilpCombo = ilp.getQuoteResponseIlp(quoteRequest, partialResponse);
            transferRequest.ilpPacket = ilpCombo.ilpPacket;
            transferRequest.condition = ilpCombo.condition;
        });

        test('Should decode the IlpPacket', () => {
            const decodedIlp = ilp.decodeIlpPacket(ilpCombo.ilpPacket);

            expect(decodedIlp).toBeTruthy();
            expect(decodedIlp.amount).toBe(ilp._getIlpCurrencyAmount(partialResponse.transferAmount));
            expect(decodedIlp.data).toBeInstanceOf(Buffer);
            expect(decodedIlp.destination).toBe(ILP_ADDRESS);
            expect(decodedIlp.expiresAt).toBeInstanceOf(Date);
            expect(decodedIlp.executionCondition).toBeInstanceOf(Buffer);
        });

        test('Should generate transaction object from an Ilp packet', () => {
            const transaction = ilp.getTransactionObject(ilpCombo.ilpPacket);

            expect(transaction).toBeTruthy();
            expect(transaction.quoteId).toBe(quoteRequest.quoteId);
            expect(transaction.transactionId).toBe(quoteRequest.transactionId);
            expect(transaction.transactionType).toEqual(quoteRequest.transactionType);
            expect(transaction.payee).toEqual(quoteRequest.payee);
            expect(transaction.payer).toEqual(quoteRequest.payer);
            expect(transaction.amount).toEqual(partialResponse.transferAmount);
            expect(transaction.expiration).toEqual(partialResponse.expiration);
        });

        test('should validate the transfer request against the decoded Ilp packet', () => {
            const validation = ilp.validateIlpAgainstTransferRequest(transferRequest);
            expect(validation).toBe(true);
        });

        test('Should fail the validation if the data in transfer request is changed', () => {
            transferRequest.amount.amount = '200';
            const validation = ilp.validateIlpAgainstTransferRequest(transferRequest);
            expect(validation).toBe(false);
        });
    });
});

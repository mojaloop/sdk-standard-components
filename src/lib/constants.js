const ApiType = Object.freeze({
    FSPIOP: 'fspiop',
    ISO20022: 'iso20022',
});

const RESOURCES = Object.freeze({
    fxQuotes: 'fxQuotes',
    fxTransfers: 'fxTransfers'
});

const ERROR_MESSAGES = Object.freeze({
    invalidIlpExpirationDate: 'Invalid ILP expiration date',
    unsupportedIlpVersion: 'Unsupported ILP version',
    invalidIlpOptions: 'Invalid ILP options',
    invalidAdjustedAmount: 'Ilp packet `amount` after scaling should be integer',
});

const ILP_VERSIONS = Object.freeze({
    v1: 'v1',
    v4: 'v4'
});

const ILP_ADDRESS = 'g.mojaloop';

const ILP_AMOUNT_FOR_FX = '0';

const ISO_20022_HEADER_PART = 'iso20022';

const ONLY_FSPIOP_RESOURCES = [
    'authorizations',
    // 'bulkQuotes',
    // 'bulkTransfers',
    'transactionRequests',
];
// todo: think about bulkQuotes/bulkTransfers

module.exports = {
    ApiType,
    RESOURCES,
    ERROR_MESSAGES,
    ILP_VERSIONS,
    ILP_ADDRESS,
    ILP_AMOUNT_FOR_FX,
    ISO_20022_HEADER_PART,
    ONLY_FSPIOP_RESOURCES
};

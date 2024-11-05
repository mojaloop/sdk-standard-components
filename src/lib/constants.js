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

module.exports = {
    RESOURCES,
    ERROR_MESSAGES,
    ILP_VERSIONS,
    ILP_ADDRESS,
    ILP_AMOUNT_FOR_FX
};

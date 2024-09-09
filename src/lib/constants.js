const RESOURCES = Object.freeze({
    fxQuotes: 'fxQuotes',
    fxTransfers: 'fxTransfers'
});

const ERROR_MESSAGES = Object.freeze({
    invalidIlpExpirationDate: 'Invalid ILP expiration date'
});

const ILP_ADDRESS = 'g.mojaloop';

const ILP_AMOUNT_FOR_FX = '0';

module.exports = {
    RESOURCES,
    ERROR_MESSAGES,
    ILP_ADDRESS,
    ILP_AMOUNT_FOR_FX
};

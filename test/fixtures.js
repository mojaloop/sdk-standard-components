const fs = require('node:fs');
const WSO2Auth = require('#src/lib/WSO2Auth/index');
const mockLogger = require('./__mocks__/mockLogger');

const jwsSigningKey = fs.readFileSync(__dirname + '/unit/data/jwsSigningKey.pem');

const moneyPayload = ({
    currency =  'EUR',
    amount = '123.45'
} = {}) => Object.freeze({ currency, amount });

const fxQuotesPayload = ({
    conversionRequestId = 'b51ec534-ee48-4575-b6a9-ead2955b8069',
    sourceAmount = moneyPayload(),
    targetAmount = moneyPayload(),
} = {}) => Object.freeze({
    conversionRequestId,
    conversionTerms: {
        conversionId: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
        determiningTransferId: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
        initiatingFsp: 'initiatingFsp',
        counterPartyFsp: 'counterPartyFsp',
        amountType: 'RECEIVE',
        sourceAmount,
        targetAmount,
        expiration: '2024-05-24T08:38:08.699-04:00',
    }
});

const fxQuotesBeResponse = (fxQuotesPayload) => {
    // eslint-disable-next-line no-unused-vars
    const { conversionRequestId, conversionTerms } = fxQuotesPayload;
    return Object.freeze({
        homeTransactionId: `${Date.now()}`,
        conversionTerms,
    });
};

// Everything is false by default
const mockConfigDto = ({
    dfspId = 'testdfsp',
    jwsSign = false,
    jwsSignPutParties = false,
    logger = mockLogger({ app: 'request-test' }),
    wso2Auth =  new WSO2Auth({ logger }),
    peerEndpoint = '127.0.0.1',
    servicesEndpoint = '127.0.0.2',
    thirdpartyRequestsEndpoint = 'thirdparty-api-adapter.local'
} = {}) => ({
    dfspId,
    logger,
    jwsSign,
    jwsSignPutParties,
    jwsSigningKey,
    wso2Auth,
    peerEndpoint,
    servicesEndpoint,
    thirdpartyRequestsEndpoint,
    tls: {
        mutualTLS: { enabled: false }
    },
});

module.exports = {
    fxQuotesPayload,
    fxQuotesBeResponse,
    moneyPayload,
    mockConfigDto,
};

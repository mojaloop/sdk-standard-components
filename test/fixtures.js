const fs = require('node:fs');
const OIDCAuth = require('#src/lib/OIDCAuth/index');
const { loggerFactory } = require('#src/lib/logger');

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
    logger = loggerFactory({ app: 'request-test' }),
    oidc = {
        auth: new OIDCAuth({ logger })
    },
    peerEndpoint = '127.0.0.1',
    servicesEndpoint = '127.0.0.2',
    thirdpartyRequestsEndpoint = 'thirdparty-api-adapter.local'
} = {}) => ({
    dfspId,
    logger,
    jwsSign,
    jwsSignPutParties,
    jwsSigningKey,
    oidc,
    peerEndpoint,
    servicesEndpoint,
    thirdpartyRequestsEndpoint,
    tls: {
        mutualTLS: { enabled: false }
    },
});

const Headers = Object.freeze({
    SOURCE: 'fspiop-source',
    DESTINATION: 'fspiop-destination',
    PROXY: 'fspiop-proxy',
    HTTP_METHOD: 'fspiop-http-method',
    SIGNATURE: 'fspiop-signature',
    URI: 'fspiop-uri'
});

module.exports = {
    fxQuotesPayload,
    fxQuotesBeResponse,
    moneyPayload,
    mockConfigDto,
    Headers,
};

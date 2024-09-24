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

module.exports = {
    fxQuotesPayload,
    fxQuotesBeResponse,
    moneyPayload,
};

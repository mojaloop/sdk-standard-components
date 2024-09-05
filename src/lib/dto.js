/**
 * Creates an immutable transaction object.
 *
 * @param {Object} quoteRequest - The request object containing quote payload.
 * @property {string} quoteId - Common ID between the FSPs for the quote object.
 * @property {string} transactionId - Common ID (decided by the Payer FSP) between the FSPs for the future transaction object.
 * @property {TransactionType} transactionType - Type of transaction for which the quote is requested.
 * @property {Party} payee - Information about the Payee.
 * @property {Party} payer - Information about the Payer.
 * @property {string} expiration - Expiration date and time of the quote (Date string).
 *
 * @param {Object} quoteResponse - The response object containing additional transaction details.
 * @property {Money} transferAmount - The amount of Money that the Payer FSP should transfer to the Payee FSP.
 * @property {string} note - note // no such param in API spec
 *
 * @returns {Object} The immutable transaction object.
 */
const transactionObjectDto = (quoteRequest, quoteResponse) => {
    const { quoteId, transactionId, transactionType, payee, payer, expiration } = quoteRequest;
    const { transferAmount, note } = quoteResponse;
    return Object.freeze({
        quoteId,
        transactionId,
        transactionType,
        payee,
        payer,
        expiration,
        amount: transferAmount,
        ...(note && { note }), // todo: clarify what this is for (no such param in API spec)
    });
};

module.exports = {
    transactionObjectDto,
};

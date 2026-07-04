/**
 * @typedef {Object} QuoteRequest
 * @property {string} quoteId - Common ID between the FSPs for the quote object.
 * @property {string} transactionId - Common ID (decided by the Payer FSP) between the FSPs for the future transaction object.
 * @property {TransactionType} transactionType - Type of transaction for which the quote is requested.
 * @property {Party} payee - Information about the Payee.
 * @property {Party} payer - Information about the Payer.
 */
/**
 * @typedef {Object} QuoteResponse
 * @property {Money} transferAmount - The amount of Money that the Payer FSP should transfer to the Payee FSP.
 * @property {string} expiration - Expiration date and time of the quote (Date string).
 * @property {string} [note] - note // no such param in API spec
 */

/**
 * Creates an immutable transaction object.
 *
 * @param {QuoteRequest} quoteRequest - The request object containing quote payload.
 * @param {QuoteResponse} quoteResponse - The response object containing additional transaction details.
 * @returns {Object} The immutable transaction object.
 */
const transactionObjectDto = (quoteRequest, quoteResponse) => {
    const { quoteId, transactionId, transactionType, payee, payer } = quoteRequest;
    const { transferAmount, expiration, note } = quoteResponse;
    return Object.freeze({
        quoteId,
        transactionId,
        transactionType,
        payee,
        payer,
        expiration,
        amount: transferAmount,
        ...(note && { note })
    });
};

module.exports = {
    transactionObjectDto
};

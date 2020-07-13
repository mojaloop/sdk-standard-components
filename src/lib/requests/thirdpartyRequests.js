'use strict';

const BaseRequests = require('./baseRequests');

class ThirdpartyRequests extends BaseRequests {
    async putConsents(consentId, consentBody, destParticipantId) {
        const url = `consents/${consentId}`;
        return this._put(url, 'thirdparty', consentBody, destParticipantId);
    }

    async postAuthorizations(authorizationBody, destParticipantId) {
        return this._post('authorizations', 'authorizations', authorizationBody, destParticipantId);
    }

    async getThirdpartyRequestsTransactions(transactionRequestId, destParticipantId) {
        const url = `thirdpartyRequests/transactions/${transactionRequestId}`;
        return this._get(url, 'thirdparty', destParticipantId);
    }

    async postThirdpartyRequestsTransactions(thirdpartyRequestsTransactionsBody, destParticipantId) {
        const url = 'thirdpartyRequests/transactions';
        return this._post(url, 'thirdparty', thirdpartyRequestsTransactionsBody, destParticipantId);
    }
}


module.exports = ThirdpartyRequests;

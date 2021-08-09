'use strict';

const BaseRequests = require('./baseRequests');

class ThirdpartyRequests extends BaseRequests {
    async patchConsents(consentId, consentBody, destParticipantId) {
        const url = `consents/${consentId}`;
        return this._patch(url, 'thirdparty', consentBody, destParticipantId);
    }

    async putConsents(consentId, consentBody, destParticipantId) {
        const url = `consents/${consentId}`;
        return this._put(url, 'thirdparty', consentBody, destParticipantId);
    }

    async putConsentsError(consentId, consentBody, destParticipantId) {
        const url = `consents/${consentId}/error`;
        return this._put(url, 'thirdparty', consentBody, destParticipantId);
    }

    async postConsents(consentBody, destParticipantId) {
        return this._post('consents', 'thirdparty', consentBody, destParticipantId);
    }

    async patchConsentRequests(consentRequestId, consentRequestBody, destParticipantId) {
        const url = `consentRequests/${consentRequestId}`;
        return this._patch(url, 'thirdparty', consentRequestBody, destParticipantId);
    }

    async putConsentRequests(consentRequestId, consentRequestBody, destParticipantId) {
        const url = `consentRequests/${consentRequestId}`;
        return this._put(url, 'thirdparty', consentRequestBody, destParticipantId);
    }

    async postConsentRequests(consentRequestBody, destParticipantId) {
        return this._post('consentRequests', 'thirdparty', consentRequestBody, destParticipantId);
    }

    async putConsentRequestsError(consentRequestId, consentRequestBody, destParticipantId) {
        const url = `consentRequests/${consentRequestId}/error`;
        return this._put(url, 'thirdparty', consentRequestBody, destParticipantId);
    }

    async postAuthorizations(authorizationBody, destParticipantId) {
        return this._post('authorizations', 'authorizations', authorizationBody, destParticipantId);
    }

    async getThirdpartyRequestsTransactions(transactionRequestId, destParticipantId) {
        const url = `thirdpartyRequests/transactions/${transactionRequestId}`;
        return this._get(url, 'thirdparty', destParticipantId);
    }

    async patchThirdpartyRequestsTransactions(thirdpartyRequestsTransactionsBody, transactionRequestId, destParticipantId) {
        const url = `thirdpartyRequests/transactions/${transactionRequestId}`;
        return this._patch(url, 'thirdparty', thirdpartyRequestsTransactionsBody, destParticipantId);
    }

    async putThirdpartyRequestsTransactions(thirdpartyRequestsTransactionsBody, transactionRequestId, destParticipantId) {
        const url = `thirdpartyRequests/transactions/${transactionRequestId}`;
        return this._put(url, 'thirdparty', thirdpartyRequestsTransactionsBody, destParticipantId);
    }

    async putThirdpartyRequestsTransactionsError(thirdpartyRequestsTransactionsBody, transactionRequestId, destParticipantId) {
        const url = `thirdpartyRequests/transactions/${transactionRequestId}/error`;
        return this._put(url, 'thirdparty', thirdpartyRequestsTransactionsBody, destParticipantId);
    }

    async postThirdpartyRequestsTransactions(thirdpartyRequestsTransactionsBody, destParticipantId) {
        const url = 'thirdpartyRequests/transactions';
        return this._post(url, 'thirdparty', thirdpartyRequestsTransactionsBody, destParticipantId);
    }

    async postThirdpartyRequestsTransactionsAuthorizations(thirdpartyRequestsTransactionsBody, transactionRequestId, destParticipantId) {
        const url = `thirdpartyRequests/transactions/${transactionRequestId}/authorizations`;
        return this._post(url, 'thirdparty', thirdpartyRequestsTransactionsBody, destParticipantId);
    }

    async putThirdpartyRequestsTransactionsAuthorizations(thirdpartyRequestsTransactionsBody, transactionRequestId, destParticipantId) {
        const url = `thirdpartyRequests/transactions/${transactionRequestId}/authorizations`;
        return this._put(url, 'thirdparty', thirdpartyRequestsTransactionsBody, destParticipantId);
    }

    async putThirdpartyRequestsTransactionsAuthorizationsError(thirdpartyRequestsTransactionsBody, transactionRequestId, destParticipantId) {
        const url = `thirdpartyRequests/transactions/${transactionRequestId}/authorizations/error`;
        return this._put(url, 'thirdparty', thirdpartyRequestsTransactionsBody, destParticipantId);
    }

    async postThirdpartyRequestsVerifications(thirdpartyRequestsVerificationsBody, destParticipantId) {
        const url = `thirdpartyRequests/verifications`;
        return this._post(url, 'thirdparty', thirdpartyRequestsVerificationsBody, destParticipantId)
    }

    async putThirdpartyRequestsVerifications(thirdpartyRequestsVerificationsBody, verificationRequestId, destParticipantId) {
        const url = `thirdpartyRequests/verifications/${verificationRequestId}`;
        return this._post(url, 'thirdparty', thirdpartyRequestsVerificationsBody, destParticipantId)
    }

    async putThirdpartyRequestsVerificationsError(thirdpartyRequestsVerificationsBody, verificationRequestId, destParticipantId) {
        const url = `thirdpartyRequests/verifications/${verificationRequestId}/error`;
        return this._post(url, 'thirdparty', thirdpartyRequestsVerificationsBody, destParticipantId)
    }

    async getAccounts (userId, destParticipantId) {
        const url = `accounts/${userId}`;
        return this._get(url, 'thirdparty', destParticipantId);
    }

    async putAccounts (userId, accountsBody, destParticipantId) {
        const url = `accounts/${userId}`;
        return this._put(url, 'thirdparty', accountsBody, destParticipantId);
    }

    async putAccountsError (userId, accountsBody, destParticipantId) {
        const url = `accounts/${userId}/error`;
        return this._put(url, 'thirdparty', accountsBody, destParticipantId);
    }

    async getServices (serviceType) {
        const url = `services/${serviceType}`;
        return this._get(url, 'services');
    }

    async putServices (serviceType, servicesBody, destParticipantId) {
        const url = `services/${serviceType}`;
        return this._put(url, 'services', servicesBody, destParticipantId);
    }

    async putServicesError (serviceType, servicesBody, destParticipantId) {
        const url = `services/${serviceType}/error`;
        return this._put(url, 'services', servicesBody, destParticipantId);
    }
}


module.exports = ThirdpartyRequests;

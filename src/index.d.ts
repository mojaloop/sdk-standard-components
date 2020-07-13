declare namespace SDKStandardComponents {
    /* Base Request Types */
    type GenericRequestResponse = {
        statusCode: number,
        // headers: IncomingMessage.headers,
        headers: any,
        data: Buffer
    }

    type MojaloopRequestResponse = undefined

    /**
     * @type BaseRequestConfigType
     */
    type BaseRequestConfigType = {
        logger: any;
        tls: any;
        // The`FSPID` of _this_ DFSP / Participant
        dfspId: string;
        // If `true`, then requests will be JWS signed

        jwsSign: boolean;
        jwsSignPutParties?: boolean;
        jwsSigningKey?: string
        wso2Auth?: object
    }

    /* Individual Request Types */
    type PutConsentsRequest = {}
    type PostAuthorizationsRequest = {}
    type PostThirdPartyRequestTransactionsRequest = {}

    class BaseRequests {
        constructor(config: BaseRequestConfigType)
    }

    /**
     * @class ThirdpartyRequests
     * @description Client library for making outbound Mojaloop requests
     *   for 3rd party functions (e.g. PISP use cases)
     */
    class ThirdpartyRequests extends BaseRequests {
        /**
         * @function putConsents
         * @description Executes a `PUT /consents/{id}` request.
         * @param {string} consentId The `id` of the consent object to be updated
         * @param {PutConsentsRequest} consentBody The body of the consent object
         * @param {string} destParticipantId The id of the destination participant
         */
        putConsents(consentId: string, consentBody: PutConsentsRequest, destParticipantId: string): Promise<GenericRequestResponse | MojaloopRequestResponse>;

        /**
         * @function postAuthorizations
         * @description
         *   Executes a `POST /authorizations` request for the specified `transactionRequestId`
         * @param {Object} authorizationBody The authorizationBody
         * @param {string} destParticipantId The id of the destination participant, in this case, a PISP
         * @returns {Promise<object>} JSON response body if one was received
         */
        postAuthorizations(authorizationBody: PostAuthorizationsRequest, destParticipantId: string): Promise<GenericRequestResponse | MojaloopRequestResponse>;

        /**
         * @function getThirdpartyRequestsTransactions
         * @description
         *   Executes a `GET /thirdpartyRequests/transactions/{transactionRequestId}` request for the specified `transactionRequestId`
         * @param {string} transactionRequestId The `id` of the transactionRequest/thirdpartyRequest
         * @param {string} destParticipantId The `id` of the destination participant, in this case, a DFSP
         * @returns {Promise<object>} JSON response body if one was received
         */
        getThirdpartyRequestsTransactions(transactionRequestId: string, destParticipantId: string): Promise<GenericRequestResponse | MojaloopRequestResponse>;

        /**
         * @function postThirdpartyRequestsTransactions
         * @description
         *   Executes a `POST /thirdpartyRequests/transactions` request
         * @param {Object} thirdpartyRequestsTransactionsBody The thirdpartyRequestsTransactionsBody
         * @param {string} destParticipantId The id of the destination participant, in this case, a DFSP
         * @returns {Promise<object>} JSON response body if one was received
         */
        postThirdpartyRequestsTransactions(thirdpartyRequestsTransactionsBody: PostThirdPartyRequestTransactionsRequest, destParticipantId: string): Promise<GenericRequestResponse | MojaloopRequestResponse>;
    }
    class MojaloopRequests extends BaseRequests {

        getParties(idType: string, idValue: string, idSubValue?: string): Promise<GenericRequestResponse | MojaloopRequestResponse>
    }

}


export = SDKStandardComponents

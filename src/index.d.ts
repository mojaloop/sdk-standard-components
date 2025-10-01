import http from 'http'
import { KeyObject } from 'tls'
import { ILogger, ContextLogger } from '@mojaloop/central-services-logger/src/contextLogger'
import {
    //This needs reconsidering if and when more changes are included in fspiop v2.0, currently they're non-breaking as far as any existing fields are replaced, but when such changes come in, this needs to be reviewed.
    v2_0 as fspiopAPI,
    thirdparty as tpAPI
} from '@mojaloop/api-snippets'

import * as ilp from './ilp'

type Json =
    | string
    | number
    | boolean
    | { [x: string]: Json }
    | Array<Json>;

declare namespace SDKStandardComponents {

    /* hashmap of versions of various resources */
    type ResourceVersions = {
        [resource: string]: {
            contentVersion: string,
            acceptVersion: string
        }
    }


    /* Base Request Types */
    type GenericRequestResponse = {
        statusCode: number;
        headers: any;
        data: Buffer;
    };

    // response could be undefined if there are problems with JSON.parse
    // the legacy code catches such exception and silently returns undefined value <- OMG
    type GenericRequestResponseUndefined = undefined;
    interface BaseRequestTLSConfig {
        mutualTLS: {
            enabled: boolean;
        };
        creds: {
            ca: string | Buffer | Array<string | Buffer>;
            cert: string | Buffer | Array<string | Buffer>;
            key?: string | Buffer | Array<Buffer | KeyObject>;
        }
    }

    type BaseRequestConfigType = {
        logger: Logger.SdkLogger;
        tls: BaseRequestTLSConfig;
        dfspId: string;
        jwsSign: boolean;
        jwsSignPutParties?: boolean;
        jwsSigningKey?: Buffer;
        oidc?: {
            auth: OIDCAuth;
            retryOidcAuthFailureTimes?: number;
        };
        alsEndpoint?: string;
        peerEndpoint?: string;
        quotesEndpoint?: string;
        bulkQuotesEndpoint?: string;
        transfersEndpoint?: string;
        fxQuotesEndpoint?: string;
        fxTransfersEndpoint?: string;
        bulkTransfersEndpoint?: string;
        servicesEndpoint?: string;
        transactionRequestsEndpoint?: string;
        thirdpartyRequestsEndpoint?: string;
        resourceVersions?: ResourceVersions;
        apiType?: string;
    }

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
         * @function patchConsents
         * @description Executes a `PATCH /consents/{id}` request.
         * @param {string} consentId The `id` of the consent object to be updated
         * @param {PatchConsentsRequest} consentBody The body of the consent object
         * @param {string} destParticipantId The id of the destination participant
         */
        patchConsents(
            consentId: string,
            consentBody: tpAPI.Schemas.ConsentsIDPatchResponseVerified | tpAPI.Schemas.ConsentsIDPatchResponseRevoked,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function putConsents
         * @description Executes a `PUT /consents/{id}` request.
         * @param {string} consentId The `id` of the consent object to be updated
         * @param {PutConsentsRequest} consentBody The body of the consent object
         * @param {string} destParticipantId The id of the destination participant
         */
        putConsents(
            consentId: string,
            consentBody: tpAPI.Schemas.ConsentsIDPutResponseSigned | tpAPI.Schemas.ConsentsIDPutResponseVerified,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function putConsents
         * @description Executes a `PUT /consents/{id}/error` request.
         * @param {string} consentId The `id` of the consent object to be updated
         * @param {PutConsentsRequest} consentBody The body of the consent object
         * @param {string} destParticipantId The id of the destination participant
         */
        putConsentsError(
            consentId: string,
            consentBody: fspiopAPI.Types.ErrorInformationObject,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function postConsents
         * @description Executes a `POST /consents` request.
         * @param {PostConsentsRequest} consentBody The body of the consent object
         * @param {string} destParticipantId The id of the destination participant
         */
        postConsents(
            consentBody: tpAPI.Schemas.ConsentsPostRequestAUTH | tpAPI.Schemas.ConsentsPostRequestPISP,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function patchConsentRequests
         * @description Executes a `PATCH /consentRequests{id}` request.
         * @param {string} consentRequestId The `id` of the consent requests object
         * @param {PatchConsentRequestsRequest} consentRequestBody The body of the consent requests object
         * @param {string} destParticipantId The id of the destination participant
         */
        patchConsentRequests(
            consentRequestId: string,
            consentRequestBody: tpAPI.Schemas.ConsentRequestsIDPatchRequest,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function putConsentRequests
         * @description Executes a `PUT /consentRequests/{id}` request.
         * @param {string} consentRequestId The `id` of the consent requests object to be updated
         * @param {PutConsentRequestsRequest} consentRequestBody The body of the consent requests object
         * @param {string} destParticipantId The id of the destination participant
         */
        putConsentRequests(
            consentRequestId: string,
            consentRequestBody:
                tpAPI.Schemas.ConsentRequestsIDPutResponseOTP |
                tpAPI.Schemas.ConsentRequestsIDPutResponseWeb,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function postConsentRequests
         * @description Executes a `POST /consentRequests` request.
         * @param {PostConsentRequestsRequest} consentRequestBody The body of the consent requests object
         * @param {string} destParticipantId The id of the destination participant
         */
        postConsentRequests(
            consentRequestBody: tpAPI.Schemas.ConsentRequestsPostRequest,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function putConsentRequestsError
         * @description Executes a `PUT /consentRequests/{id}/error` request.
         * @param {string} consentRequestId The `id` of the consent request object to be updated
         * @param {PutConsentsRequest} consentRequestBody The body of the consent request object
         * @param {string} destParticipantId The id of the destination participant
         */
        putConsentRequestsError(
            consentRequestId: string,
            consentRequestBody: fspiopAPI.Types.ErrorInformationObject,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function getThirdpartyRequestsTransactions
         * @description
         *   Executes a `GET /thirdpartyRequests/transactions/{transactionRequestId}` request for the specified `transactionRequestId`
         * @param {string} transactionRequestId The `id` of the transactionRequest/thirdpartyRequest
         * @param {string} destParticipantId The `id` of the destination participant, in this case, a DFSP
         * @returns {Promise<object>} JSON response body if one was received
         */
        getThirdpartyRequestsTransactions(
            transactionRequestId: string,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function postThirdpartyRequestsTransactions
         * @description
         *   Executes a `POST /thirdpartyRequests/transactions` request
         * @param {Object} thirdpartyRequestsTransactionsBody The thirdpartyRequestsTransactionsBody
         * @param {string} destParticipantId The id of the destination participant, in this case, a DFSP
         * @returns {Promise<object>} JSON response body if one was received
         */
        postThirdpartyRequestsTransactions(
            thirdpartyRequestsTransactionsBody: tpAPI.Schemas.ThirdpartyRequestsTransactionsPostRequest,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function putThirdpartyRequestsTransactions
         * @description
         *   Executes a `PUT /thirdpartyRequests/transactions/${transactionRequestId}` request
         * @param {Object} thirdpartyRequestsTransactionsBody The thirdpartyRequestsTransactionsBody
         * @param {string} transactionRequestId The `id` of the transactionRequest/thirdpartyRequest
         * @param {string} destParticipantId The id of the destination participant, in this case, a DFSP
         * @returns {Promise<object>} JSON response body if one was received
         */
        putThirdpartyRequestsTransactions(
            thirdpartyRequestsTransactionsBody: tpAPI.Schemas.ThirdpartyRequestsTransactionsIDPutResponse,
            transactionRequestId: string,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function patchThirdpartyRequestsTransactions
         * @description
         *   Executes a `PATCH /thirdpartyRequests/transactions/${transactionRequestId}` request
         * @param {Object} thirdpartyRequestsTransactionsBody The thirdpartyRequestsTransactionsBody
         * @param {string} transactionRequestId The `id` of the transactionRequest/thirdpartyRequest
         * @param {string} destParticipantId The id of the destination participant, in this case, a DFSP
         * @returns {Promise<object>} JSON response body if one was received
         */
         patchThirdpartyRequestsTransactions(
            thirdpartyRequestsTransactionsBody: tpAPI.Schemas.ThirdpartyRequestsTransactionsIDPatchResponse,
            transactionRequestId: string,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function putThirdpartyRequestsTransactionsError
         * @description
         *   Executes a `PUT thirdpartyRequests/transactions/${transactionRequestId}/error` request
         * @param {Object} thirdpartyRequestsTransactionsBody The thirdpartyRequestsTransactionsBody
         * @param {string} transactionRequestId The `id` of the transactionRequest/thirdpartyRequest
         * @param {string} destParticipantId The id of the destination participant, in this case, a DFSP
         * @returns {Promise<object>} JSON response body if one was received
         */
        putThirdpartyRequestsTransactionsError(
            thirdpartyRequestsTransactionsBody: fspiopAPI.Types.ErrorInformationObject,
            transactionRequestId: string,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function postThirdpartyRequestsAuthorizations
         * @description
         *   Executes a `POST /thirdpartyRequests/authorizations` request
         * @param {Object} body The authorization request body
         * @param {string} destParticipantId The id of the destination participant, in this case, a DFSP
         * @returns {Promise<object>} JSON response body if one was received
         */
        postThirdpartyRequestsAuthorizations(
            body: tpAPI.Schemas.ThirdpartyRequestsAuthorizationsPostRequest,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function putThirdpartyRequestsAuthorizations
         * @description
         *   Executes a `PUT /thirdpartyRequests/authorizations/${authorizationRequestId}` request
         * @param {Object} body The authorization response body
         * @param {string} authorizationRequestId The authorizationRequestId
         * @param {string} destParticipantId The id of the destination participant, in this case, a DFSP
         * @returns {Promise<object>} JSON response body if one was received
         */
        putThirdpartyRequestsAuthorizations(
            body: tpAPI.Schemas.ThirdpartyRequestsAuthorizationsIDPutResponse,
            authorizationRequestId: string,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function putThirdpartyRequestsAuthorizations
         * @description
         *   Executes a `PUT /thirdpartyRequests/authorizations/${authorizationRequestId}/error` request
         * @param {Object} body The error body
         * @param {string} authorizationRequestId The authorizationRequestId
         * @param {string} destParticipantId The id of the destination participant, in this case, a DFSP
         * @returns {Promise<object>} JSON response body if one was received
         */
        putThirdpartyRequestsAuthorizationsError(
            body: tpAPI.Schemas.ThirdpartyRequestsAuthorizationsIDPutResponse,
            authorizationRequestId: string,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function getAccounts
         * @description Executes a `GET /accounts/{id}` request.
         * @param {string} userId The `id` of the user
         * @param {string} destParticipantId The id of the destination participant
         */
         getAccounts (
            userId: string,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function putAccounts
         * @description Executes a `PUT /accounts/{id}` request.
         * @param {string} userId The `id` of the user
         * @param {AccountsIDPutResponse} accountsBody The body of the accounts object
         * @param {string} destParticipantId The id of the destination participant
         */
        putAccounts (
            userId: string,
            accountsBody: tpAPI.Schemas.AccountsIDPutResponse,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function putAccountsError
         * @description Executes a `PUT /accounts/{id}/error` request.
         * @param {string} userId The `id` of the user
         * @param {TErrorInformationObject} accountsBody The body of the error object
         * @param {string} destParticipantId The id of the destination participant
         */
        putAccountsError (
            userId: string,
            accountsBody: fspiopAPI.Types.ErrorInformationObject,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function getServices
         * @description Executes a `GET /services/{ServiceType}` request.
         * @param {string} serviceType The `serviceType` to query
         */
         getServices (
            serviceType: string,
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function putServices
         * @description Executes a `PUT /services/{ServiceType}` request.
         * @param {string} serviceType The `serviceType` that was queried
         * @param {ServicesServiceTypePutResponse} servicesBody The body of the services object
         * @param {string} destParticipantId The id of the destination participant
         */
        putServices (
            serviceType: string,
            servicesBody: tpAPI.Schemas.ServicesServiceTypePutResponse,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function putServicesError
         * @description Executes a `PUT /services/{ServiceType}/error` request.
         * @param {string} serviceType The `serviceType` that was queried
         * @param {TErrorInformationObject} servicesBody The body of the error object
         * @param {string} destParticipantId The id of the destination participant
         */
         putServicesError (
            serviceType: string,
            servicesBody: fspiopAPI.Types.ErrorInformationObject,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function postThirdpartyRequestsVerifications
         * @description
         *   Executes a `POST /thirdpartyRequests/verifications` request
         * @param {Object} thirdpartyRequestsTransactionsBody The thirdpartyRequestsVerificationsBody
         * @param {string} destParticipantId The id of the destination participant, in this case, a DFSP
         * @returns {Promise<object>} JSON response body if one was received
         */
        postThirdpartyRequestsVerifications(
            thirdpartyRequestsVerificationsBody: tpAPI.Schemas.ThirdpartyRequestsVerificationsPostRequest,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function putThirdpartyRequestsVerifications
         * @description
         *   Executes a `PUT /thirdpartyRequests/verifications/{ID}` request
         * @param {Object} thirdpartyRequestsTransactionsBody The thirdpartyRequestsVerificationsBody
         * @param {string} verificationsRequestId The id of the verification request send by the DFSP
         * @param {string} destParticipantId The id of the destination participant, in this case, a DFSP
         * @returns {Promise<object>} JSON response body if one was received
         */
        putThirdpartyRequestsVerifications(
            thirdpartyRequestsVerificationsBody: tpAPI.Schemas.ThirdpartyRequestsVerificationsIDPutResponse,
            verificationsRequestId: string,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function putThirdpartyRequestsVerificationsError
         * @description
         *   Executes a `PUT /thirdpartyRequests/verifications/{ID}/error` request
         * @param {Object} thirdpartyRequestsTransactionsBody The body of the error object
         * @param {string} verificationsRequestId The id of the verification request send by the DFSP
         * @param {string} destParticipantId The id of the destination participant, in this case, a DFSP
         * @returns {Promise<object>} JSON response body if one was received
         */
        putThirdpartyRequestsVerificationsError(
            thirdpartyRequestsVerificationsBody: fspiopAPI.Types.ErrorInformationObject,
            verificationsRequestId: string,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;
    }

    class MojaloopRequests extends BaseRequests {
        /**
         * @function getParties
         * @description
         *   Executes a GET /parties request for the specified identifier type and identifier
         * @param {string} idType The party id type
         * @param {string} id The party id
         * @param {string} [idSubValue] The optional party id sub value
         * @returns Promise<{object}> - JSON response body if one was received
         */
        getParties(
            idType: string,
            idValue: string,
            idSubValue?: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function putParties
         * @description
         *   Executes a PUT /parties request for the specified identifier type and identifier
         * @param {string} idType The party id type
         * @param {string} id The party id
         * @param {string} [idSubValue] The party id sub value - pass `undefined` if not specified
         * @param {object} body The party's properties
         * @param {string} destFspId The id of the destination participant, in this case, a DFSP
         */
        putParties(
            idType: string,
            idValue: string,
            idSubValue: string | undefined,
            body: fspiopAPI.Types.Party,
            destFspId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function putPartiesError
         * @description
         *   Executes a PUT /parties/{IdType}/{IdValue}/error request for the specified identifier type and identifier
         * @param {string} idType The party id type
         * @param {string} id The party id
         * @param {string} [idSubValue] The party id sub value - pass `undefined` if not specified
         * @param {Error} [error] The error specification
         * @param {string} destFspId The id of the destination participant, in this case, a DFSP
         */
        putPartiesError(
            idType: string,
            idValue: string,
            idSubValue: string | undefined,
            error: fspiopAPI.Types.ErrorInformationObject,
            destFspId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function postQuotes
         * @description
         *   Executes a `POST /postQuotes` request
         * @param {Object} postQuoteRequest The postQuoteRequest
         * @param {string} destParticipantId The id of the destination participant, in this case, a DFSP
         * @returns {Promise<object>} JSON response body if one was received
         */
        postQuotes(
            quoteRequest: fspiopAPI.Types.QuotesPostRequest,
            destParticipantId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

        /**
         * @function putAuthorizations
         * @description
         *   Executes a 'PUT /authorizations' request
         * @param {string} transactionRequestId
         * @param {object} authorizationResponse
         * @param {string} destFspId
         */
        putAuthorizations(
            transactionRequestId: string,
            authorizationResponse: fspiopAPI.Types.AuthorizationsIDPutResponse,
            destFspId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>

        /**
         * @function putAuthorizationsError
         * @description
         *   Executes a `PUT /authorizations/{ID}/error
         * @param {string} transactionRequestId
         * @param {object} error
         * @param {string} destFspId
         */
        putAuthorizationsError(
            transactionRequestId: string,
            error: fspiopAPI.Types.ErrorInformationObject,
            destFspId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>

        /**
         * @function postParticipants
         * @description
         *   Executes a `POST /participants`
         * @param {object} participantRequest The participant request
         * @param {string} destFspId The id of the destination participant
         */
        postParticipants(
            participantRequest: fspiopAPI.Types.ParticipantsPostRequest,
            destFspId: string
        ): Promise<GenericRequestResponse | GenericRequestResponseUndefined>
    }

    interface OIDCAuthConfig {
        logger: Logger.SdkLogger,
        tlsCreds?: {
            ca: string
            cert: string
            key: string
        },
        clientKey?: string
        clientSecret?: string
        tokenEndpoint?: string
        refreshSeconds?: number
        refreshRetrySeconds?: number
        staticToken?: string
    }
    /** @description Obtain OIDC access token and periodically refresh it */
    class OIDCAuth {
        constructor(config: OIDCAuthConfig)

        /**
         * @function getToken
         * @description returns the latest retrieved token
         * @returns {string} the latest token
         */
        getToken(): string

        /**
         * @function start
         * @description starts the retrieve fresh token periodic task
         * @returns {Promise<void>}
         */
        start(): void

        /**
         * @function stop
         * @description stops the retrieve fresh token periodic task
         * @returns {void}
         */
        stop(): void
    }

    namespace Logger {
        type Level = 'silly' | 'debug' | 'verbose' | 'perf' | 'info' | 'trace' | 'audit' | 'warn' | 'error'
        type LogContext = Json | null;
        type LogMeta = Json | Error | null;

        type CreateLoggerFactoryConfig = {
            context?: LogContext,
            isJsonOutput?: boolean,
        }
        // todo: need to be aligned with ContextLogger ctor params

        export function loggerFactory(config?: CreateLoggerFactoryConfig): SdkLogger;

        export class SdkLogger extends ContextLogger implements ILogger {
            child(context?: LogContext): SdkLogger
            push(context?: LogContext): SdkLogger
            log(message: string, meta?: LogMeta): void
        }
        export const LOG_LEVELS: Level[]
    }

    enum RequestResponseType { ArrayBuffer, JSON, Text, Stream }
    type RequestMethod = 'GET' | 'PATCH' | 'POST' | 'PUT'
    export type RequestBody = string | Buffer | Uint8Array
    interface RequestOptions {
        method: RequestMethod
        uri: string
        agent: http.Agent
        qs?: { [key: string]: unknown }
        headers?: Headers
        // body is passed to http.ClientRequest.write
        // https://nodejs.org/api/http.html#http_class_http_clientrequest
        // https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback
        body? : RequestBody
        responseType?: RequestResponseType
    }
    interface RequestResponse<Data = string | Buffer | Record<string, unknown>>{
        statusCode: number
        headers?: Headers
        data: Data
    }

    function request<Data>(opts: RequestOptions): Promise<RequestResponse<Data>>

    namespace request {
        let ResponseType: RequestResponseType
    }

    namespace requests {
        namespace common {
            function bodyStringifier(arg0: unknown): string | Buffer
        }

        type PutPingParams = {
            requestId: string;
            destination: string;
            headers: Headers;
        }

        /** Client library for making outbound ping requests in the Mojaloop ecosystem */
        export class PingRequests extends BaseRequests {
            constructor(config: BaseRequestConfigType & {
                pingEndpoint?: string;
            });

            putPing(params: PutPingParams): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;

            putPingError(params: PutPingParams & {
                errInfo: Errors.MojaloopApiErrorObject;
            }): Promise<GenericRequestResponse | GenericRequestResponseUndefined>;
        }
    }

    namespace Errors {
        interface MojaloopApiErrorCode {
            code: string
            message: string
            httpStatusCode?: number
        }

        interface MojaloopApiErrorObject {
            errorInformation: {
                errorCode: string
                errorDescription: string
                extensionList?: unknown[]
            }
        }
        interface MojaloopApiErrorCodesEnum {
            //Generic communication errors
            COMMUNICATION_ERROR:              MojaloopApiErrorCode
            DESTINATION_COMMUNICATION_ERROR:  MojaloopApiErrorCode

            //Generic server errors
            SERVER_ERROR:                     MojaloopApiErrorCode
            INTERNAL_SERVER_ERROR:            MojaloopApiErrorCode
            NOT_IMPLEMENTED:                  MojaloopApiErrorCode
            SERVICE_CURRENTLY_UNAVAILABLE:    MojaloopApiErrorCode
            SERVER_TIMED_OUT:                 MojaloopApiErrorCode
            SERVER_BUSY:                      MojaloopApiErrorCode

            //Generic client errors
            METHOD_NOT_ALLOWED:               MojaloopApiErrorCode
            CLIENT_ERROR:                     MojaloopApiErrorCode
            UNACCEPTABLE_VERSION:             MojaloopApiErrorCode
            UNKNOWN_URI:                      MojaloopApiErrorCode
            ADD_PARTY_INFO_ERROR:             MojaloopApiErrorCode
            DELETE_PARTY_INFO_ERROR:          MojaloopApiErrorCode, // Error code thrown in ALS when deleting participant info fails

            //Client validation errors
            VALIDATION_ERROR:                 MojaloopApiErrorCode
            MALFORMED_SYNTAX:                 MojaloopApiErrorCode
            MISSING_ELEMENT:                  MojaloopApiErrorCode
            TOO_MANY_ELEMENTS:                MojaloopApiErrorCode
            TOO_LARGE_PAYLOAD:                MojaloopApiErrorCode
            INVALID_SIGNATURE:                MojaloopApiErrorCode
            MODIFIED_REQUEST:                 MojaloopApiErrorCode
            MISSING_MANDATORY_EXTENSION:      MojaloopApiErrorCode

            //identifier errors
            ID_NOT_FOUND:                     MojaloopApiErrorCode
            DESTINATION_FSP_ERROR:            MojaloopApiErrorCode
            PAYER_FSP_ID_NOT_FOUND:           MojaloopApiErrorCode
            PAYEE_FSP_ID_NOT_FOUND:           MojaloopApiErrorCode
            PARTY_NOT_FOUND:                  MojaloopApiErrorCode
            QUOTE_ID_NOT_FOUND:               MojaloopApiErrorCode
            TXN_REQUEST_ID_NOT_FOUND:         MojaloopApiErrorCode
            TXN_ID_NOT_FOUND:                 MojaloopApiErrorCode
            TRANSFER_ID_NOT_FOUND:            MojaloopApiErrorCode
            BULK_QUOTE_ID_NOT_FOUND:          MojaloopApiErrorCode
            BULK_TRANSFER_ID_NOT_FOUND:       MojaloopApiErrorCode

            //expired errors
            EXPIRED_ERROR:                    MojaloopApiErrorCode
            TXN_REQUEST_EXPIRED:              MojaloopApiErrorCode
            QUOTE_EXPIRED:                    MojaloopApiErrorCode
            TRANSFER_EXPIRED:                 MojaloopApiErrorCode

            //payer errors
            PAYER_ERROR:                      MojaloopApiErrorCode
            PAYER_FSP_INSUFFICIENT_LIQUIDITY: MojaloopApiErrorCode
            PAYER_REJECTION:                  MojaloopApiErrorCode
            PAYER_REJECTED_TXN_REQUEST:       MojaloopApiErrorCode
            PAYER_FSP_UNSUPPORTED_TXN_TYPE:   MojaloopApiErrorCode
            PAYER_UNSUPPORTED_CURRENCY:       MojaloopApiErrorCode
            PAYER_LIMIT_ERROR:                MojaloopApiErrorCode
            PAYER_PERMISSION_ERROR:           MojaloopApiErrorCode
            PAYER_BLOCKED_ERROR:              MojaloopApiErrorCode

            //payee errors
            PAYEE_ERROR:                      MojaloopApiErrorCode
            PAYEE_FSP_INSUFFICIENT_LIQUIDITY: MojaloopApiErrorCode
            PAYEE_REJECTION:                  MojaloopApiErrorCode
            PAYEE_REJECTED_QUOTE:             MojaloopApiErrorCode
            PAYEE_FSP_UNSUPPORTED_TXN_TYPE:   MojaloopApiErrorCode
            PAYEE_FSP_REJECTED_QUOTE:         MojaloopApiErrorCode
            PAYEE_REJECTED_TXN:               MojaloopApiErrorCode
            PAYEE_FSP_REJECTED_TXN:           MojaloopApiErrorCode
            PAYEE_UNSUPPORTED_CURRENCY:       MojaloopApiErrorCode
            PAYEE_IDENTIFIER_NOT_VALID:       MojaloopApiErrorCode
            PAYEE_LIMIT_ERROR:                MojaloopApiErrorCode
            PAYEE_PERMISSION_ERROR:           MojaloopApiErrorCode
            GENERIC_PAYEE_BLOCKED_ERROR:      MojaloopApiErrorCode

            // thirdparty errors
            TP_ERROR:                         MojaloopApiErrorCode
            TP_TRANSACTION_ERROR:             MojaloopApiErrorCode
            TP_FSP_TRANSACTION_REQUEST_NOT_VALID: MojaloopApiErrorCode
            TP_FSP_TRANSACTION_UPDATE_FAILED: MojaloopApiErrorCode
            TP_FSP_TRANSACTION_REQUEST_QUOTE_FAILED: MojaloopApiErrorCode
            TP_FSP_TRANSACTION_REQUEST_AUTHORIZATION_FAILED: MojaloopApiErrorCode
            TP_FSP_TRANSACTION_AUTHORIZATION_NOT_VALID: MojaloopApiErrorCode
            TP_FSP_TRANSACTION_AUTHORIZATION_REJECTED_BY_USER: MojaloopApiErrorCode
            TP_FSP_TRANSACTION_AUTHORIZATION_UNEXPECTED: MojaloopApiErrorCode
            TP_FSP_TRANSACTION_TRANSFER_FAILED: MojaloopApiErrorCode
            TP_FSP_TRANSACTION_NOTIFICATION_FAILED: MojaloopApiErrorCode

            TP_ACCOUNT_LINKING_ERROR:         MojaloopApiErrorCode
            TP_NO_SERVICE_PROVIDERS_FOUND:    MojaloopApiErrorCode
            TP_NO_ACCOUNTS_FOUND:             MojaloopApiErrorCode
            TP_NO_SUPPORTED_AUTH_CHANNELS:    MojaloopApiErrorCode
            TP_NO_SUPPORTED_SCOPE_ACTIONS:    MojaloopApiErrorCode
            TP_OTP_VALIDATION_ERROR:          MojaloopApiErrorCode
            TP_FSP_OTP_VALIDATION_ERROR:      MojaloopApiErrorCode
            TP_FSP_CONSENT_SCOPES_ERROR:      MojaloopApiErrorCode
            TP_CONSENT_REQ_VALIDATION_ERROR:  MojaloopApiErrorCode
            TP_FSP_CONSENT_REQ_NO_SCOPES:     MojaloopApiErrorCode
            TP_NO_TRUSTED_CALLBACK_URI:       MojaloopApiErrorCode
            TP_CONSENT_REQ_USER_NOT_ALLOWED:  MojaloopApiErrorCode
            TP_SIGNED_CHALLENGE_MISMATCH:     MojaloopApiErrorCode
            TP_CONSENT_INVALID:               MojaloopApiErrorCode
            TP_FAILED_REG_ACCOUNT_LINKS:      MojaloopApiErrorCode
            TP_AUTH_SERVICE_ERROR:            MojaloopApiErrorCode
        }

        const MojaloopApiErrorCodes: MojaloopApiErrorCodesEnum

        function MojaloopApiErrorCodeFromCode(code: string): MojaloopApiErrorCode

        function MojaloopApiErrorObjectFromCode(code: MojaloopApiErrorCode): MojaloopApiErrorObject

        interface FullErrorObject {
            message: string
            replyTo: string
            apiErrorCode: MojaloopApiErrorCode
            extensions?: unknown
            cause?: string
        }
        class MojaloopFSPIOPError extends Error {
            public cause: Error | undefined
            public message: string
            public replyTo: string
            public apiErrorCode: MojaloopApiErrorCode
            public extensions: unknown

            constructor(
                cause: Error | undefined,
                message: string,
                replyTo: string,
                apiErrorCode: MojaloopApiErrorCode,
                extensions?: unknown
            )

            toApiErrorObject(): MojaloopApiErrorObject
            toFullErrorObject(): FullErrorObject
            toString(): string
        }
    }

    type JwsValidatorConfig = {
        logger: Logger.SdkLogger
        validationKeys: Record<string, Buffer> | Record<string, string>
    }

    type JwsSignerConfig = {
        logger: Logger.SdkLogger
        signingKey: String
    }

    type JwsRequest = {
        body?: Record<string, unknown>
        data?:  Record<string, unknown>
        uri?: string
        url?: string
        method?: string
        headers?: Record<string, unknown>
    }

    namespace Jws {
        class JwsValidator {
            constructor(config: JwsValidatorConfig)

            /**
             * @function validate
             * @description Validates the JWS headers on an incoming HTTP request
             * @param request {object} a request-promise-native/axios style request options object
             *   (see https://github.com/request/request-promise-native)
             *   (see https://github.com/axios/axios)
             *
             * Throws if the protected header or signature are not valid
            */
            validate(request: JwsRequest): true
        }

        class JwsSigner {
            constructor(config: JwsSignerConfig)
            /**
             * @function sign
             * @description Returns JWS signature for an outgoing HTTP request options object
             * @param requestOptions {object} a request-promise-native/axios style request options object
             *   (see https://github.com/request/request-promise-native)
             *   (see https://github.com/axios/axios)
             *
             */
            sign(requestOptions: JwsRequest): void
            /**
             * @function getSignature
             * @description Returns JWS signature for an outgoing HTTP request options object
             * @param requestOptions {object} a request-promise-native/axios style request options object
             *   (see https://github.com/request/request-promise-native)
             *   (see https://github.com/axios/axios)
             *
             * @returns {string} - JWS Signature as a string
            */
            getSignature(requestOptions: JwsRequest): string
        }

        var validator: typeof JwsValidator
        var signer: typeof JwsSigner
    }

    interface IlpProcessor {
        new (options: IlpOptions): IlpProcessor;
        version: keyof typeof Ilp.ILP_VERSIONS;
        calculateConditionFromFulfil(fulfilment: string): string;
        calculateFulfil(ilpPacket: string): string
        decodeIlpPacket(ilpPacket: string): ilp.IlpInputV1 | ilp.IlpInputV4;
        getFxQuoteResponseIlp(fxQuoteRequest: ilp.FxQuoteRequest, fxQuoteBeResponse: ilp.FxQuoteBeResponse): ilp.IlpResponse;
        getQuoteResponseIlp(quoteRequest: ilp.QuoteRequest, quoteResponse: ilp.QuoteResponse): ilp.IlpResponse;
        getResponseIlp(transactionObject: ilp.TransactionObject): ilp.IlpResponse;
        getTransactionObject(ilpPacket: string): ilp.TransactionObject;
        validateFulfil(fulfilment: string, condition: string): boolean;
        validateIlpAgainstTransferRequest(transactionObject: ilp.TransactionObject): boolean;
    }

    type IlpOptions = {
        secret: string;
        logger: Logger.SdkLogger;
    }

    namespace Ilp {
        const ilpFactory: (version: keyof typeof ILP_VERSIONS, options: IlpOptions) => IlpProcessor;

        const ILP_VERSIONS: Readonly<{
            v1: 'v1';
            v4: 'v4';
        }>;
    }

    namespace utils {
        function cleanupIncomingHeaders(headers: Headers, incomingHeadersRemoval?: string[]): Headers;
    }

    type Headers = Record<string, string>;
}

export = SDKStandardComponents

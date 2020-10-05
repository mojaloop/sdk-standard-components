import http from 'http'
import { KeyObject } from 'tls'
declare namespace SDKStandardComponents {
    /* Base Mojaloop Types */

    // Ref: https://github.com/mojaloop/api-snippets/blob/master/v1.0/openapi3/schemas/Currency.yaml
    type TCurrency = 'AED' | 'AFN' | 'ALL' | 'AMD' | 'ANG' | 'AOA' | 'ARS' | 'AUD' | 'AWG' | 'AZN' |
        'BAM' | 'BBD' | 'BDT' | 'BGN' | 'BHD' | 'BIF' | 'BMD' | 'BND' | 'BOB' | 'BRL' | 'BSD' | 'BTN' | 'BWP' | 'BYN' | 'BZD' |
        'CAD' | 'CDF' | 'CHF' | 'CLP' | 'CNY' | 'COP' | 'CRC' | 'CUC' | 'CUP' | 'CVE' | 'CZK' |
        'DJF' | 'DKK' | 'DOP' | 'DZD' |
        'EGP' | 'ERN' | 'ETB' | 'EUR' |
        'FJD' | 'FKP' |
        'GBP' | 'GEL' | 'GGP' | 'GHS' | 'GIP' | 'GMD' | 'GNF' | 'GTQ' | 'GYD' |
        'HKD' | 'HNL' | 'HRK' | 'HTG' | 'HUF' |
        'IDR' | 'ILS' | 'IMP' | 'INR' | 'IQD' | 'IRR' | 'ISK' |
        'JEP' | 'JMD' | 'JOD' | 'JPY' |
        'KES' | 'KGS' | 'KHR' | 'KMF' | 'KPW' | 'KRW' | 'KWD' | 'KYD' | 'KZT' |
        'LAK' | 'LBP' | 'LKR' | 'LRD' | 'LSL' | 'LYD' |
        'MAD' | 'MDL' | 'MGA' | 'MKD' | 'MMK' | 'MNT' | 'MOP' | 'MRO' | 'MUR' | 'MVR' | 'MWK' | 'MXN' | 'MYR' | 'MZN' |
        'NAD' | 'NGN' | 'NIO' | 'NOK' | 'NPR' | 'NZD' |
        'OMR' |
        'PAB' | 'PEN' | 'PGK' | 'PHP' | 'PKR' | 'PLN' | 'PYG' |
        'QAR' |
        'RON' | 'RSD' | 'RUB' | 'RWF' |
        'SAR' | 'SBD' | 'SCR' | 'SDG' | 'SEK' | 'SGD' | 'SHP' | 'SLL' | 'SOS' | 'SPL' | 'SRD' | 'STD' | 'SVC' | 'SYP' | 'SZL' |
        'THB' | 'TJS' | 'TMT' | 'TND' | 'TOP' | 'TRY' | 'TTD' | 'TVD' | 'TWD' | 'TZS' |
        'UAH' | 'UGX' | 'USD' | 'UYU' | 'UZS' |
        'VEF' | 'VND' | 'VUV' |
        'WST' |
        'XAF' | 'XCD' | 'XDR' | 'XOF' | 'XPF' |
        'YER' |
        'ZAR' | 'ZMW' | 'ZWD';

    type TAuthChannel = 'WEB' | 'OTP';

    // Ref: https://github.com/mojaloop/api-snippets/blob/master/v1.0/openapi3/schemas/Party.yaml
    type TParty = {
        partyIdInfo: {
            fspId: string;
            partyIdType: string;
            partyIdentifier: string;
            partySubIdentifier?: string;
        }
        merchantClassificationCode?: string;
        name?: string;
        personalInfo?: {
            complexName?: {
                firstName?: string;
                middleName?: string;
                lastName?: string;
            }
            dateOfBirth?: string
        };
    };

    // Ref: https://github.com/mojaloop/api-snippets/blob/master/v1.0/openapi3/schemas/Money.yaml
    type TMoney = {
        amount: string;
        currency: TCurrency;
    };

    // Ref: https://github.com/mojaloop/api-snippets/blob/master/v1.0/openapi3/schemas/GeoCode.yaml
    type TGeoCode = {
        latitude: string;
        longitude: string;
    }

    // Ref: https://github.com/mojaloop/api-snippets/blob/master/v1.0/openapi3/schemas/ExtensionList.yaml
    type TExtensionList = {
        extension: Array<{
            key: string;
            value: string;
        }>
    }

    // Ref: https://github.com/mojaloop/api-snippets/blob/master/v1.0/openapi3/schemas/QuotesIDPutResponse.yaml
    type TQuotesIDPutResponse = {
        transferAmount: TMoney;
        expiration: Date;
        ilpPacket: string;
        condition: string;
        payeeReceiveAmount?: TMoney;
        payeeFspFee?: TMoney;
        payeeFspCommission?: TMoney;
        geoCode?: TGeoCode;
        extensionList?: TExtensionList
    }

    // Ref: https://github.com/mojaloop/api-snippets/blob/master/v1.0/openapi3/schemas/ErrorInformationObject.yaml
    type TErrorInformationObject = {
        errorInformation: TErrorInformation;
    }

    // Ref: https://github.com/mojaloop/api-snippets/blob/master/v1.0/openapi3/schemas/ErrorInformation.yaml
    type TErrorInformation = {
        errorCode: string;
        errorDescription: string;
        extensionList?: TExtensionList;
    }

    type TCredential = {
        id: string | null;
        credentialType: 'FIDO';
        status: 'PENDING' | 'VERIFIED';
        challenge: {
            payload: string;
            signature: string | null;
        },
        payload: string | null;
    }

    type TCredentialScope = {
        actions: string[];
        accountId: string;
    }

    // Ref: https://github.com/mojaloop/api-snippets/blob/master/v1.0/openapi3/schemas/AmountType.yaml
    enum TAmountType {
        SEND = 'SEND',
        RECEIVE = 'RECEIVE',
    }

    /* hashmap of versions of various resources */
    type TResourceVersions = {
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

    type MojaloopRequestResponse = undefined;
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
        logger: Logger.Logger;
        tls: BaseRequestTLSConfig;
        dfspId: string;
        jwsSign: boolean;
        jwsSignPutParties?: boolean;
        jwsSigningKey?: Buffer;
        wso2Auth?: object;
        alsEndpoint?: string;
        peerEndpoint?: string;
        quotesEndpoint?: string;
        bulkQuotesEndpoint?: string;
        transfersEndpoint?: string;
        bulkTransfersEndpoint?: string;
        transactionRequestsEndpoint?: string;
        thirdpartyRequestsEndpoint?: string;
        resourceVersions?: TResourceVersions;
    }

    /* Individual Request Types */
    type PutConsentsRequest = {
        requestId: string;
        initiatorId: string;
        participantId: string;
        scopes: Array<{
            accountId: string;
            actions: Array<string>;
        }>;
        credential: TCredential;
    }

    type PostConsentsRequest = {
        id: string;
        requestId: string;
        initiatorId: string;
        participantId: string;
        scopes: TCredentialScope[];
        credential?: TCredential;
    }

    type PutConsentRequestsRequest = {
        initiatorId: string;
        authChannels: TAuthChannel[];
        scopes: TCredentialScope[];
        callbackUri: string;
        authUri: string | null;
        authToken: string;
    }

    type PostConsentRequestsRequest = {
        id: string;
        initiatorId: string;
        authChannels: TAuthChannel[];
        scopes: TCredentialScope[];
        callbackUri: string;
    }

    type PostAuthorizationsRequest = {
        transactionRequestId: string;
        authenticationType: 'U2F';
        retriesLeft: string;
        amount: TMoney;
        transactionId: string;
        quote: TQuotesIDPutResponse;
    }

    type AuthenticationType = 'OTP' | 'QRCODE' | 'U2F'
      
    type AuthenticationValue = {
        pinValue: string;
        counter: string;
    }
    
    type AuthenticationInfo = {
        authentication: AuthenticationType;
        authenticationValue: AuthenticationValue | string;
    }
      
    type AuthorizationResponse = 'ENTERED' | 'REJECTED' | 'RESEND';
    
    type PutAuthorizationRequest = {
        authenticationInfo: AuthenticationInfo;
        responseType: AuthorizationResponse;
    }

    type TransactionType = {
        scenario: string;
        initiator: string;
        initiatorType: string;
    }
    type PostThirdPartyRequestTransactionsRequest = {
        transactionRequestId: string;
        sourceAccountId: string;
        consentId: string;
        payee: TParty;
        payer: TParty;
        amountType: TAmountType;
        amount: TMoney;
        transactionType: TransactionType;
        expiration: string;
    }

    type PutThirdpartyRequestsTransactionsAuthorizationsRequest = {
        challenge: string;
        consentId: string;
        sourceAccountId: string;
        status: 'PENDING' | 'VERIFIED';
        value: string;
    }

    type PatchConsentsRequest = {
        status: 'REVOKED';
        revokedAt: string;
    }

    class BaseRequests {
        constructor(config: BaseRequestConfigType)
    }

    type PutThirdpartyRequestsTransactionsRequest = {
        transactionRequestId: string;
        transactionRequestState: 'RECEIVED' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
    }

    type PostThirdpartyRequestsTransactionsAuthorizationsRequest = {
        challenge: string;
        consentId: string;
        sourceAccountId: string;
        status: 'PENDING' | 'VERIFIED';
        value: string;
    }

    type PostQuoteRequest = {
        quoteId: string;
        transactionId: string;
        transactionRequestId: string;
        payee: TParty;
        payer: TParty;
        amountType: TAmountType;
        amount: TMoney;
        transactionType: TransactionType;
        note: string;
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
            consentBody: PatchConsentsRequest,
            destParticipantId: string
        ): Promise<GenericRequestResponse | MojaloopRequestResponse>;

        /**
         * @function putConsents
         * @description Executes a `PUT /consents/{id}` request.
         * @param {string} consentId The `id` of the consent object to be updated
         * @param {PutConsentsRequest} consentBody The body of the consent object
         * @param {string} destParticipantId The id of the destination participant
         */
        putConsents(
            consentId: string,
            consentBody: PutConsentsRequest,
            destParticipantId: string
        ): Promise<GenericRequestResponse | MojaloopRequestResponse>;

        /**
         * @function putConsents
         * @description Executes a `PUT /consents/{id}/error` request.
         * @param {string} consentId The `id` of the consent object to be updated
         * @param {PutConsentsRequest} consentBody The body of the consent object
         * @param {string} destParticipantId The id of the destination participant
         */
        putConsentsError(
            consentId: string,
            consentBody: TErrorInformationObject,
            destParticipantId: string
        ): Promise<GenericRequestResponse | MojaloopRequestResponse>;

        /**
         * @function postConsents
         * @description Executes a `POST /consents` request.
         * @param {PostConsentsRequest} consentBody The body of the consent object
         * @param {string} destParticipantId The id of the destination participant
         */
        postConsents(
            consentBody: PostConsentsRequest,
            destParticipantId: string
        ): Promise<GenericRequestResponse | MojaloopRequestResponse>;

        /**
         * @function putConsentRequests
         * @description Executes a `PUT /consentRequests/{id}` request.
         * @param {string} consentRequestId The `id` of the consent requests object to be updated
         * @param {PutConsentRequestsRequest} consentRequestBody The body of the consent requests object
         * @param {string} destParticipantId The id of the destination participant
         */
        putConsentRequests(
            consentRequestId: string,
            consentRequestBody: PutConsentRequestsRequest,
            destParticipantId: string
        ): Promise<GenericRequestResponse | MojaloopRequestResponse>;

        /**
         * @function postConsentRequests
         * @description Executes a `POST /consentRequests` request.
         * @param {PostConsentRequestsRequest} consentRequestBody The body of the consent requests object
         * @param {string} destParticipantId The id of the destination participant
         */
        postConsentRequests(
            consentRequestBody: PostConsentRequestsRequest,
            destParticipantId: string
        ): Promise<GenericRequestResponse | MojaloopRequestResponse>;


        /**
         * @function postAuthorizations
         * @description
         *   Executes a `POST /authorizations` request for the specified `transactionRequestId`
         * @param {Object} authorizationBody The authorizationBody
         * @param {string} destParticipantId The id of the destination participant, in this case, a PISP
         * @returns {Promise<object>} JSON response body if one was received
         */
        postAuthorizations(
            authorizationBody: PostAuthorizationsRequest,
            destParticipantId: string
        ): Promise<GenericRequestResponse | MojaloopRequestResponse>;

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
        ): Promise<GenericRequestResponse | MojaloopRequestResponse>;

        /**
         * @function postThirdpartyRequestsTransactions
         * @description
         *   Executes a `POST /thirdpartyRequests/transactions` request
         * @param {Object} thirdpartyRequestsTransactionsBody The thirdpartyRequestsTransactionsBody
         * @param {string} destParticipantId The id of the destination participant, in this case, a DFSP
         * @returns {Promise<object>} JSON response body if one was received
         */
        postThirdpartyRequestsTransactions(
            thirdpartyRequestsTransactionsBody: PostThirdPartyRequestTransactionsRequest,
            destParticipantId: string
        ): Promise<GenericRequestResponse | MojaloopRequestResponse>;

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
            thirdpartyRequestsTransactionsBody: PutThirdpartyRequestsTransactionsRequest,
            transactionRequestId: string,
            destParticipantId: string
        ): Promise<GenericRequestResponse | MojaloopRequestResponse>;

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
            thirdpartyRequestsTransactionsBody: TErrorInformationObject,
            transactionRequestId: string,
            destParticipantId: string
        ): Promise<GenericRequestResponse | MojaloopRequestResponse>;

        /**
         * @function postThirdpartyRequestsTransactionsAuthorizations
         * @description
         *   Executes a `POST /thirdpartyRequests/transactions/${transactionRequestId}/authorizations` request
         * @param {Object} thirdpartyRequestsTransactionsBody The thirdpartyRequestsTransactionsBody
         * @param {string} transactionRequestId The `id` of the transactionRequest/thirdpartyRequest
         * @param {string} destParticipantId The id of the destination participant, in this case, a DFSP
         * @returns {Promise<object>} JSON response body if one was received
         */
        postThirdpartyRequestsTransactionsAuthorizations(
            thirdpartyRequestsTransactionsBody: PostThirdpartyRequestsTransactionsAuthorizationsRequest,
            transactionRequestId: string,
            destParticipantId: string
        ): Promise<GenericRequestResponse | MojaloopRequestResponse>;

        /**
         * @function putThirdpartyRequestsTransactionsAuthorizations
         * @description
         *   Executes a `PUT /thirdpartyRequests/transactions/${transactionRequestId}/authorizations` request
         * @param {putThirdpartyRequestsTransactionsAuthorizationsRequest} thirdpartyRequestsTransactionsBody The thirdpartyRequestsTransactionsBody
         * @param {string} transactionRequestId The `id` of the transactionRequest/thirdpartyRequest
         * @param {string} destParticipantId The id of the destination participant, in this case, a DFSP
         * @returns {Promise<object>} JSON response body if one was received
         */
        putThirdpartyRequestsTransactionsAuthorizations(
            thirdpartyRequestsTransactionsBody: PutThirdpartyRequestsTransactionsAuthorizationsRequest,
            transactionRequestId: string,
            destParticipantId: string
        ): Promise<GenericRequestResponse | MojaloopRequestResponse>;

        /**
         * @function putThirdpartyRequestsTransactionsAuthorizationsError
         * @description
         *   Executes a `PUT thirdpartyRequests/transactions/${transactionRequestId}/authorizations/error` request
         * @param {putThirdpartyRequestsTransactionsAuthorizationsRequest} thirdpartyRequestsTransactionsBody The thirdpartyRequestsTransactionsBody
         * @param {string} transactionRequestId The `id` of the transactionRequest/thirdpartyRequest
         * @param {string} destParticipantId The id of the destination participant, in this case, a DFSP
         * @returns {Promise<object>} JSON response body if one was received
         */
        putThirdpartyRequestsTransactionsAuthorizationsError(
            thirdpartyRequestsTransactionsBody: TErrorInformationObject,
            transactionRequestId: string,
            destParticipantId: string
        ): Promise<GenericRequestResponse | MojaloopRequestResponse>;
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
        ): Promise<GenericRequestResponse | MojaloopRequestResponse>;

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
            body: TParty,
            destFspId: string
        ): Promise<GenericRequestResponse | MojaloopRequestResponse>;

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
            error: TErrorInformationObject,
            destFspId: string
        ): Promise<GenericRequestResponse | MojaloopRequestResponse>;
        
        /**
         * @function postQuotes
         * @description
         *   Executes a `POST /postQuotes` request
         * @param {Object} postQuoteRequest The postQuoteRequest
         * @param {string} destParticipantId The id of the destination participant, in this case, a DFSP
         * @returns {Promise<object>} JSON response body if one was received
         */
        postQuotes(
            quoteRequest: PostQuoteRequest,
            destParticipantId: string
        ): Promise<GenericRequestResponse | MojaloopRequestResponse>;

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
            authorizationResponse: PutAuthorizationRequest,
            destFspId: string 
        ): Promise<GenericRequestResponse | MojaloopRequestResponse>

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
            error: TErrorInformationObject,
            destFspId: string 
        ): Promise<GenericRequestResponse | MojaloopRequestResponse>

    }

    interface WSO2AuthConfig {
        logger: Logger.Logger,
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
    /**
     * @class WSO2Auth
     * @description Obtain WSO2 bearer token and periodically refresh it
     */
    class WSO2Auth {
        constructor(config: WSO2AuthConfig)

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
        type Level = 'verbose' | 'debug' | 'warn' | 'error' | 'trace' | 'info' | 'fatal'
        type TimestampFormatter = (ts: Date) => string;
        type Stringify = (toBeStringified: unknown) => string;
        interface LoggerStringifyParams { 
            ctx: unknown
            msg: unknown
            level: Level 
        }

        type LoggerStringify = (params: LoggerStringifyParams) => string

        
        interface BuildStringifyParams {
            space?: number
            printTimestamp?: boolean
            timestampFmt?: TimestampFormatter 
            stringify?: Stringify
        }
        type BuildStringify = (params: BuildStringifyParams) => LoggerStringify;
        
        function buildStringify(params: BuildStringifyParams): LoggerStringify

        interface LoggerOptions {
            allowContextOverwrite: boolean
            copy: (unknown) => unknown
            levels: Level[]
        }

        interface LoggerConstructorParams {
            ctx?: unknown 
            stringify?: BuildStringify
            opts?: LoggerOptions
        }

        interface LoggerConfigureParams {
            stringify?: BuildStringify
            opts?: LoggerOptions
        }

        /** 
         * @class Logger
         * @description fast and lightweight logger which do pretty dumping of anything into the log in a pretty way 
         */
        class Logger {
            protected stringify: BuildStringify
            protected opts: LoggerOptions
    
            constructor(params?: LoggerConstructorParams)
            
            configure(params?: LoggerConfigureParams): void

            push(arg: unknown): Logger
            log(...args: unknown[]): void

            // default set of logging methods taken from default levels
            // if you want to use different log levels 
            // this part of code will not work for you
            verbose(arg: unknown): void
            debug(arg: unknown): void
            warn(arg: unknown): void
            error(arg: unknown): void
            trace(arg: unknown): void
            info(arg: unknown): void
            fatal(arg: unknown): void
        }
    }

    enum RequestResponseType { ArrayBuffer, JSON, Text, Stream }
    type RequestMethod = 'GET' | 'PATCH' | 'POST' | 'PUT'
    export type RequestBody = string | Buffer | Uint8Array
    interface RequestOptions {
        method: RequestMethod
        uri: string
        agent: http.Agent
        qs?: string
        headers?: Record<string, string>
        // body is passed to http.ClientRequest.write
        // https://nodejs.org/api/http.html#http_class_http_clientrequest
        // https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback
        body? : RequestBody
        responseType?: RequestResponseType
    }
    interface RequestResponse<Data = string | Buffer | Record<string, unknown>>{
        statusCode: number
        headers?: Record<string, string>
        data: Data
    }

    function request<Data>(opts: RequestOptions): Promise<RequestResponse<Data>>

    namespace request {
        let ResponseType: RequestResponseType
    }

    namespace requests {
        namespace common {
            function bodyStringifier(unknown): string | Buffer 
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
                extensionList: unknown[]
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
            PAYEE_LIMIT_ERROR:                MojaloopApiErrorCode
            PAYEE_PERMISSION_ERROR:           MojaloopApiErrorCode
            GENERIC_PAYEE_BLOCKED_ERROR:      MojaloopApiErrorCode
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
            public cause: Error | unknown
            public message: string
            public replyTo: string
            public apiErrorCode: MojaloopApiErrorCode
            public extensions: unknown

            constructor(
                cause: Error | unknown,
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
}

export = SDKStandardComponents

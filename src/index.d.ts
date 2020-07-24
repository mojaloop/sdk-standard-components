declare namespace SDKStandardComponents {
    /* Base Mojaloop Types */

    // Ref: https://github.com/mojaloop/api-snippets/blob/master/v1.0/openapi3/schemas/Currency.yaml
    type TCurrency = 'AED' | 'AFN' | 'ALL' | 'AMD' | 'ANG' | 'AOA' | 'ARS' | 'AUD' | 'AWG' | 'AZN' | 'BAM' | 'BBD' | 'BDT' | 'BGN' | 'BHD' | 'BIF' | 'BMD' | 'BND' | 'BOB' | 'BRL' | 'BSD' | 'BTN' | 'BWP' | 'BYN' | 'BZD' | 'CAD' | 'CDF' | 'CHF' | 'CLP' | 'CNY' | 'COP' | 'CRC' | 'CUC' | 'CUP' | 'CVE' | 'CZK' | 'DJF' | 'DKK' | 'DOP' | 'DZD' | 'EGP' | 'ERN' | 'ETB' | 'EUR' | 'FJD' | 'FKP' | 'GBP' | 'GEL' | 'GGP' | 'GHS' | 'GIP' | 'GMD' | 'GNF' | 'GTQ' | 'GYD' | 'HKD' | 'HNL' | 'HRK' | 'HTG' | 'HUF' | 'IDR' | 'ILS' | 'IMP' | 'INR' | 'IQD' | 'IRR' | 'ISK' | 'JEP' | 'JMD' | 'JOD' | 'JPY' | 'KES' | 'KGS' | 'KHR' | 'KMF' | 'KPW' | 'KRW' | 'KWD' | 'KYD' | 'KZT' | 'LAK' | 'LBP' | 'LKR' | 'LRD' | 'LSL' | 'LYD' | 'MAD' | 'MDL' | 'MGA' | 'MKD' | 'MMK' | 'MNT' | 'MOP' | 'MRO' | 'MUR' | 'MVR' | 'MWK' | 'MXN' | 'MYR' | 'MZN' | 'NAD' | 'NGN' | 'NIO' | 'NOK' | 'NPR' | 'NZD' | 'OMR' | 'PAB' | 'PEN' | 'PGK' | 'PHP' | 'PKR' | 'PLN' | 'PYG' | 'QAR' | 'RON' | 'RSD' | 'RUB' | 'RWF' | 'SAR' | 'SBD' | 'SCR' | 'SDG' | 'SEK' | 'SGD' | 'SHP' | 'SLL' | 'SOS' | 'SPL' | 'SRD' | 'STD' | 'SVC' | 'SYP' | 'SZL' | 'THB' | 'TJS' | 'TMT' | 'TND' | 'TOP' | 'TRY' | 'TTD' | 'TVD' | 'TWD' | 'TZS' | 'UAH' | 'UGX' | 'USD' | 'UYU' | 'UZS' | 'VEF' | 'VND' | 'VUV' | 'WST' | 'XAF' | 'XCD' | 'XDR' | 'XOF' | 'XPF' | 'YER' | 'ZAR' | 'ZMW' | 'ZWD';

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

    // Ref: https://github.com/mojaloop/api-snippets/blob/master/v1.0/openapi3/schemas/AmountType.yaml
    enum TAmountType {
        SEND = 'SEND',
        RECEIVE = 'RECEIVE',
    }

    /* Base Request Types */
    type GenericRequestResponse = {
        statusCode: number;
        headers: any;
        data: Buffer;
    };

    type MojaloopRequestResponse = undefined;

    type BaseRequestConfigType = {
        logger: any;
        tls: any;
        dfspId: string;
        jwsSign: boolean;
        jwsSignPutParties?: boolean;
        jwsSigningKey?: string
        wso2Auth?: object
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
        credential: {
            id: string | null;
            credentialType: 'FIDO';
            status: 'PENDING' | 'VERIFIED';
            challenge: {
                payload: string;
                signature: string | null;
            },
            payload: string | null;
        }
    }

    type PostAuthorizationsRequest = {
        transactionRequestId: string;
        authenticationType: 'U2F';
        retriesLeft: string;
        amount: TAmount;
        transactionId: string;
        quote: TQuotesIDPutResponse;
    }

    type PostThirdPartyRequestTransactionsRequest = {
        transactionRequestId: string;
        sourceAccountId: string;
        consentId: string;
        payee: TParty;
        payer: TParty;
        amountType: TAmountType;
        amount: TMoney;
        transactionType: {
            scenario: string;
            initiator: string;
            initiatorType: string;
        };
        expiration: string;
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
}

export = SDKStandardComponents

// todo: think, how to generate JSDocs based on these TS types
export type IlpResponse = {
    fulfilment: string;
    condition: string;
    ilpPacket: string;
}

export type TransactionObject = {
    quoteId: string;
    transactionId: string;
    transactionType: TransactionType;
    payee: Party;
    payer: Party;
    expiration: string;
    amount: {
        amount: string;
        currency: string;
    };
    note?: string;
};

export type IlpInputV1 = {
    amount: string;
    account: string;
    data: Buffer;
};

export type IlpInputV4 = {
    amount: string;
    destination: string;
    expiresAt: Date;
    executionCondition: string;
    data: Buffer;
};

export type Party = {
    partyIdInfo: {
        partyIdType: string // enum: MSISDN, EMAIL, ...
        partyIdentifier: string
        fspId: string
    },
    name?: string;
    personalInfo?: {
        complexName?: {
            firstName: string,
            middleName: string,
            lastName: string
        },
        dateOfBirth?: string
        kycInformation?: string
    }
    supportedCurrencies?: string[]
}

export type TransactionType = {
    scenario: 'DEPOSIT' |  'WITHDRAWAL' | 'TRANSFER' | 'PAYMENT' | 'REFUND';
    initiator: 'PAYER' | 'PAYEE';
    initiatorType: 'CONSUMER' | 'AGENT' | 'BUSINESS' | 'DEVICE';
    balanceOfPayments?: string;
    refundInfo?: {
        originalTransactionId: string;
        refundReason?: string;
    },
    subScenario?: string;
}

export type FxQuoteRequest = {
    conversionRequestId: string;
    // todo: define the rest fields
}

export type FxQuoteBeResponse = {
    conversionTerms: {
        expiration: string;
    };
    // todo: define the rest fields
};

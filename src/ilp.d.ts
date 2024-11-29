// todo: think, how to generate JSDocs based on these TS types
type Prettify<T> = { //to make hover overlay more readable
    [K in keyof T]: T[K];
} & {};

type Amount = {
    amount: string;
    currency: string;
};

export type IlpResponse = {
    fulfilment: string;
    condition: string;
    ilpPacket: string;
}

export type TransactionObject = Prettify<
    Pick<QuoteRequest, 'quoteId' | 'transactionId' | 'transactionType' | 'payee' | 'payer' | 'expiration'> & {
        amount: Amount;
        note?: string;
    }
>;

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

export type QuoteRequest = {
    quoteId: string;
    transactionId: string;
    transactionType: TransactionType;
    payee: Party;
    payer: Party;
    expiration: string;
    // add more fields, if needed
}

export type QuoteResponse = {
    transferAmount: Amount;
    note?: string;
    // add more fields, if needed
};

export type FxQuoteRequest = {
    conversionRequestId: string;
    // add more fields, if needed
}

export type FxQuoteBeResponse = {
    conversionTerms: {
        expiration: string;
    };
    // add more fields, if needed
};

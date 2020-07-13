export = MojaloopRequests;

type GenericRequestResponse = {
    statusCode: number,
    // headers: IncomingMessage.headers,
    headers: any,
    data: Buffer
}

type MojaloopRequestResponse = undefined

/*~ Write your module's methods and properties in this class */
declare class MojaloopRequests {
    constructor(config: any);

    getParties(idType: string, idValue: string, idSubValue?: string): Promise<GenericRequestResponse | MojaloopRequestResponse>
}

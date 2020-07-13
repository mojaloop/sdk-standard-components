declare namespace SDKStandardComponents {
    // export * from './requests/mojaloopRequests'
    type GenericRequestResponse = {
        statusCode: number,
        // headers: IncomingMessage.headers,
        headers: any,
        data: Buffer
    }

    type MojaloopRequestResponse = undefined

}

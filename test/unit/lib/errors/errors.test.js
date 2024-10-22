/*************************************************************************
 *  (C) Copyright Mojaloop Foundation. 2024 - All rights reserved.        *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - jbush@mojaloop.io                                   *
 *                                                                        *
 *  CONTRIBUTORS:                                                         *
 *       James Bush - jbush@mojaloop.io                                   *
 *************************************************************************/

const { MojaloopApiErrorCodes,
    MojaloopApiErrorCodeFromCode,
    MojaloopApiErrorObjectFromCode,
    MojaloopFSPIOPError } = require('../../../../src/lib/errors');


describe('Mojaloop errors', () => {
    it('all error constants have a code and a message', async () => {
        const allOk = Object.keys(MojaloopApiErrorCodes).every(k => {
            return (MojaloopApiErrorCodes[k].code.length > 0 && MojaloopApiErrorCodes[k].message.length > 0);
        });

        expect(allOk).toEqual(true);
    });

    it('returns a mojaloop error code object given a valid mojaloop error code', async() => {
        const c = '5200';
        const ec = MojaloopApiErrorCodeFromCode(c);

        expect(ec).not.toBeUndefined();
        expect(ec.code).not.toBeUndefined();
        expect(ec.code).toEqual(c);
        expect(ec.message).not.toBeUndefined();
    });

    it('returns a mojaloop API error object given a valid mojaloop error code', async () => {
        const c = '5200';
        const ec = MojaloopApiErrorCodeFromCode(c);

        const mec = MojaloopApiErrorObjectFromCode(ec);

        expect(mec).not.toBeUndefined();
        expect(mec.errorInformation).not.toBeUndefined();
        expect(mec.errorInformation.errorCode).toEqual(c);
        expect(mec.errorInformation.errorDescription).not.toBeUndefined();
    });

    it('constructs a MojaloopFSPIOPError object correctly', async () => {
        const replyToFsp = 'replyfsp';
        const msg = 'test message';
        const c = '5200';
        const ec = MojaloopApiErrorCodeFromCode(c);
        const cause = new Error('test cause');

        const me = new MojaloopFSPIOPError(cause, msg, replyToFsp, ec, {});

        expect(me.name).toEqual('FSPIOPError');
        expect(me.cause).toEqual(cause);
        expect(me.replyTo).toEqual(replyToFsp);
        expect(me.apiErrorCode).toEqual(ec);
        expect(me.httpStatusCode).toEqual(ec.httpStatusCode);

        const apiError = me.toApiErrorObject();
        expect(apiError).not.toBeUndefined();
        expect(apiError.errorInformation).not.toBeUndefined();
        expect(apiError.errorInformation.errorCode).toEqual(ec.code);
        expect(apiError.errorInformation.errorDescription).toEqual(ec.message);

        const errorString = me.toString();
        expect(errorString).not.toBeUndefined();
        expect(errorString.length).toBeGreaterThan(0);

        const fullErrorObject = me.toFullErrorObject();
        expect(fullErrorObject).not.toBeUndefined();
        expect(fullErrorObject.message).toEqual(msg);
        expect(fullErrorObject.replyTo).toEqual(replyToFsp);
        expect(fullErrorObject.apiErrorCode).toEqual(ec);
        expect(fullErrorObject.extensions).toEqual({});
        expect(fullErrorObject.cause).toEqual(cause.stack);
    });
});

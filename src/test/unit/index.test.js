/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       pawel.marzec - pawel.marzec@modusbox.com                         *
 **************************************************************************/

describe('index layout', () => {
    const index = require('../../index');
    const shouldBeExported = [
        'Errors',
        'Ilp',
        'Jws',
        'Logger',
        'MojaloopRequests',
        'ThirdpartyRequests',
        'request',
        'WSO2Auth',
    ];

    shouldBeExported.forEach((item) => {
        it(`should export '${item}'`, () => {
            expect(index[item]).toBeDefined();
        });
    });
});
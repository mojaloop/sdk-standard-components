/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2020 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Paweł Marzec - pawel.marzec@modusbox.com                         *
 **************************************************************************/

const { Logger } = require('../../lib/logger');

function mockLogger(context, keepQuiet) {
    // if keepQuiet is undefined then be quiet
    if (keepQuiet || typeof keepQuiet === 'undefined') {
        const log = {
            log: jest.fn()
        };
        return {
            ...log,
            push: jest.fn(() => log)
        };
    }

    return new Logger({ context });
}

module.exports = mockLogger;

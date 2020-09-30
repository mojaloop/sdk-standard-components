/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - james.bush@modusbox.com                             *
 **************************************************************************/

'use strict';

const MojaloopRequests = require('./mojaloopRequests.js');
const ThirdpartyRequests = require('./thirdpartyRequests.js');
const common = require('./common');

module.exports = {
    common,
    MojaloopRequests,
    ThirdpartyRequests,
};

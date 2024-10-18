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

const { TransformFacades } = require('@mojaloop/ml-schema-transformer-lib');

const ApiType = {
    FSPIOP: 'fspiop',
    ISO20022: 'iso20022',
};

/*
  Performs translation between message body formats on request bodies IF NEEDED.

  Having the logic to decide whether to translate or not encapsulated here means we can keep request processing
  code simple with no branching
*/
class ApiTransformer {
    constructor(conf) {
        this._logger = conf.logger;
        this._apiType = conf.apiType;

        if(!['fspiop', 'iso20022'].includes(this._apiType)) {
            throw new Error(`Unsupported apiType: ${this._apiType}`);
        }
    }

    async transformOutboundRequest(resourceType, method, { body, headers, params }){
        // we only need to translate the body if we are not in FSPIOP mode
        if(this._apiType === ApiType.FSPIOP) {
            return { body, headers, params };
        }

        // pass the required options through the transform facade
        let transformOpts = {
            headers: headers,
            body: body,
            params: params,
        };

        // seems a bit backwards to call the facade for transforming to ISO "FSPIOP" but here we are.
        return TransformFacades.FSPIOP[resourceType][method.toLowerCase()](transformOpts);
    }
}

module.exports = {
    ApiType,
    ApiTransformer,
};

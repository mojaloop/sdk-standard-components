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
const { ApiType } = require('../constants');

/*
  Performs translation between message body formats on request bodies IF NEEDED.

  Having the logic to decide whether to translate or not encapsulated here means we can keep request processing
  code simple with no branching
*/
class ApiTransformer {
    constructor (conf) {
        this._logger = conf.logger;
        this._apiType = conf.apiType;

        if (!Object.values(ApiType).includes(this._apiType)) {
            throw new Error(`Unsupported apiType: ${this._apiType}`);
        }
    }

    async transformOutboundRequest (resourceType, method, { body, headers, params, isError, $context }) {
    // we only need to translate the body if we are not in FSPIOP mode...
    // and there is a translation available for the specific resource type
        if (this._apiType === ApiType.FSPIOP || !TransformFacades.FSPIOP[resourceType]) {
            return { body, headers, params };
        }

        // pass the required options through the transform facade
        const transformOpts = {
            headers,
            body,
            params,
            $context
        };

        // seems a bit backwards to call the facade for transforming to ISO "FSPIOP" but here we are.
        // Note that the {method}Error way of calling the right transform method is a convention and as such somewhat
        // flaky in the long run. Further work should be done on the transformer lib to eliminate the need to use string
        // matching by the caller; e.g. by passing the entire request context to be transformed rather than just the body
        return TransformFacades.FSPIOP[resourceType][method.toLowerCase() + (isError ? 'Error' : '')](transformOpts, { unrollExtensions: true });
    }
}

module.exports = {
    ApiType,
    ApiTransformer
};

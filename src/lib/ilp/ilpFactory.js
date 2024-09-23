const { ILP_VERSIONS, ERROR_MESSAGES } = require('../constants');
const IlpV1 = require('./IlpV1');
const IlpV4 = require('./IlpV4');

const ilpFactory = (version, options) => {
    if (!options) throw new Error(ERROR_MESSAGES.noIlpOptionsProvided);

    if (version === ILP_VERSIONS.v1) return new IlpV1(options);
    if (version === ILP_VERSIONS.v4) return new IlpV4(options);

    throw new Error(ERROR_MESSAGES.unsupportedIlpVersion);
};

module.exports = ilpFactory;

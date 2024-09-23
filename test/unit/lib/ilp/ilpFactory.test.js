const { ilpFactory, ILP_VERSIONS } = require('#src/lib/ilp/index');
const IlpV1 = require('#src/lib/ilp/IlpV1');
const IlpV4 = require('#src/lib/ilp/IlpV4');
const { ERROR_MESSAGES } = require('#src/lib/constants');

describe('ilpFactory Tests -->', () => {
    test('should throw error if unsupported version is provided', () => {
        expect(() => ilpFactory('xxx', {})).toThrow(ERROR_MESSAGES.unsupportedIlpVersion);
    });

    test('should throw error if no ilp options provided', () => {
        expect(() => ilpFactory('')).toThrow(ERROR_MESSAGES.noIlpOptionsProvided);
    });

    test('should create IlpV1 instance', () => {
        const ilp = ilpFactory(ILP_VERSIONS.v1, {});
        expect(ilp).toBeInstanceOf(IlpV1);
    });

    test('should create IlpV4 instance', () => {
        const ilp = ilpFactory(ILP_VERSIONS.v4, {});
        expect(ilp).toBeInstanceOf(IlpV4);
    });
});

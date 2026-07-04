const path = require('path');

module.exports = {
    verbose: true,
    globals: {
        __ROOT__: path.resolve(__dirname)
    },
    clearMocks: true,
    collectCoverage: true,
    collectCoverageFrom: ['<rootDir>/src/lib/**/*.js'],
    coverageReporters: ['json', 'lcov', 'text'],
    coverageThreshold: {
        global: {
            statements: 50,
            functions: 0,
            branches: 0,
            lines: 50
        }
    }
};

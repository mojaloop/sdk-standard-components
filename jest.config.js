const path = require('path');

module.exports = {
    verbose: true,
    globals: {
        __ROOT__: path.resolve(__dirname)
    },
    clearMocks: true,
    collectCoverage: true,
    collectCoverageFrom: ['./lib/**/*.js'],
    coverageReporters: ['json', 'lcov', 'text'],
    coverageThreshold: {
        global: {
            statements: 90,
            functions: 90,
            branches: 90,
            lines: 90
        }
    },
};

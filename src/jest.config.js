const path = require('path');

module.exports = {
    verbose: true,
    globals: {
        __ROOT__: path.resolve(__dirname)
    },
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

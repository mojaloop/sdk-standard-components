const { Logger, transports } = require(`${__ROOT__}/lib/logger`);

describe('Logger', () => {
    test('should construct', () => {
        const l = new Logger();
    });
});

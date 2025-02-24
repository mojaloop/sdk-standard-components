const { Logger } = require('#src/lib/logger/index');
const { logLevels } = require('#src/lib/logger/helpers');

describe('Logger', () => {
    // From https://stackoverflow.com/a/14322189
    const iso8601regex = /^([+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([.,]\d+(?!:))?)?(\17[0-5]\d([.,]\d+)?)?([zZ]|([+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;
    const logObj = {
        msg: expect.any(String),
        ts: expect.stringMatching(iso8601regex),
        ctx: expect.any(Object),
    };

    test('should construct', () => {
        expect(new Logger()).toBeTruthy();
    });

    test('should have static logLevels list', () => {
        expect(Logger.logLevels).toEqual(logLevels);
    });

    test('should log correctly', () => {
        const l = new Logger({
            opts: { isJsonOutput: true }
        });
        const msg = 'test message';
        l._write = jest.fn();
        l.log(msg);
        expect(l._write).toHaveBeenCalledTimes(1);
        expect(JSON.parse(l._write.mock.calls[0][0])).toStrictEqual(expect.objectContaining({ ...logObj, msg }));
    });

    test('should have correct default level properties', () => {
        const l = new Logger();
        l.opts.levels.forEach(level => {
            expect(l[level]).toBeDefined();
        });
    });

    test('should have correct custom level properties', () => {
        const levels = ['blah', 'whatever', 'any'];
        const l = new Logger({ opts: { levels } });
        levels.forEach(level => {
            expect(l[level]).toBeDefined();
        });
    });

    test('custom levels should log correctly', () => {
        const data = [
            { level: 'blah', message: 'whatever' },
            { level: 'whatever', message: 'yadda' },
            { level: 'any', message: 'something' },
        ];
        const l = new Logger({
            opts: {
                levels: data.map(d => d.level),
                isJsonOutput: true
            }
        });
        l._write = jest.fn();
        data.forEach(({ level, message }) => {
            l[level](message);
        });
        expect(l._write).toHaveBeenCalledTimes(3);
        const expected = expect.arrayContaining(data.map(({ level, message }) => expect.objectContaining({
            ...logObj,
            level,
            msg: message,
            ctx: {}
        })));
        expect(l._write.mock.calls.map(call => JSON.parse(call[0]))).toStrictEqual(expected);
    });


    test('standard levels should be silent and not throw an error when log level excludes them', () => {
        const l = new Logger({ opts: { levels: ['mylevel']} });
        l.verbose('test');
        expect(l.isVerboseEnabled).toBe(false);
        l.debug('test');
        expect(l.isDebugEnabled).toBe(false);
        l.warn('test');
        expect(l.isWarnEnabled).toBe(false);
        l.info('test');
        expect(l.isInfoEnabled).toBe(false);
        l.error('test');
        expect(l.isErrorEnabled).toBe(false);
        l.trace('test');
        expect(l.isTraceEnabled).toBe(false);
        l.fatal('test');
        expect(l.isFatalEnabled).toBe(false);
    });

    test('isLevelEnabled should be true when level is passed as an opt', () => {
        const l = new Logger({ opts: { levels: ['verbose', 'debug', 'warn', 'info', 'error', 'trace', 'fatal'] } });
        l.verbose('test');
        expect(l.isVerboseEnabled).toBe(true);
        l.debug('test');
        expect(l.isDebugEnabled).toBe(true);
        l.warn('test');
        expect(l.isWarnEnabled).toBe(true);
        l.info('test');
        expect(l.isInfoEnabled).toBe(true);
        l.error('test');
        expect(l.isErrorEnabled).toBe(true);
        l.trace('test');
        expect(l.isTraceEnabled).toBe(true);
        l.fatal('test');
        expect(l.isFatalEnabled).toBe(true);
    });

    test('added context should be printed on the child', () => {
        const l = new Logger({
            opts: { isJsonOutput: true }
        });
        l._write = jest.fn();
        const ctx = { test: 'data' };
        const k = l.push(ctx);
        k._write = jest.fn();
        k.log('hello');
        expect(k._write).toHaveBeenCalledTimes(1);
        expect(JSON.parse(k._write.mock.calls[0])).toStrictEqual(expect.objectContaining({ ...logObj, ctx }));
    });

    test('added context should not mutate the logger, and should only be printed on the child', () => {
        const l = new Logger({
            opts: { isJsonOutput: true }
        });
        l._write = jest.fn();
        l.log('hello');
        const k = l.push({ test: 'data' });
        expect(Object.is(k, l)).toBe(false);
        expect(Object.is(k._write, l._write)).toBe(false);
        l.log('hello');
        k._write = jest.fn();
        k.log('hello');
        expect(l._write).toHaveBeenCalledTimes(2);
        expect(k._write).toHaveBeenCalledTimes(1);
        expect(JSON.parse(l._write.mock.calls[0]).ctx).toStrictEqual(JSON.parse(l._write.mock.calls[1]).ctx);
        expect(JSON.parse(l._write.mock.calls[0]).ctx).not.toStrictEqual(JSON.parse(k._write.mock.calls[0]).ctx);
    });

    test('context should propagate through descendants', () => {
        const l = new Logger({
            opts: { isJsonOutput: true }
        });
        const ctxChild = { child: 'data' };
        const k = l.push(ctxChild);
        const ctxGrandchild = { grandchild: 'whatever' };
        const j = k.push(ctxGrandchild);
        j._write = jest.fn();
        const msg = 'text';
        j.log(msg);
        expect(j._write).toHaveBeenCalledTimes(1);
        expect(JSON.parse(j._write.mock.calls[0])).toStrictEqual(expect.objectContaining({
            ...logObj,
            ctx: {
                ...ctxChild,
                ...ctxGrandchild,
            },
            msg,
        }));
    });

    test('key clashes in context should throw an error!!!', () => {
        const l = new Logger({
            opts: { allowContextOverwrite: false, isJsonOutput: true }
        });
        const ctx = { test: 'data' };
        expect(() => l.push(ctx).push(ctx)).toThrow('Key already exists in logger');
    });

    test('circular references should be handled correctly in context', () => {
        const l = new Logger({
            opts: { isJsonOutput: true }
        });
        let ctx = {};
        ctx.ctx = ctx;
        const k = l.push(ctx);
        k._write = jest.fn();
        k.log('irrelevant');
        expect(k._write).toHaveBeenCalledTimes(1);
        expect(JSON.parse(k._write.mock.calls[0])).toStrictEqual(expect.objectContaining({
            ...logObj,
            ctx: {
                ctx: {
                    ctx: '[Circular]'
                }
            }
        }));
    });

    test('circular references should be handled correctly in log message', () => {
        const l = new Logger({
            opts: { isJsonOutput: true }
        });
        let ctx = {};
        ctx.ctx = ctx;
        l._write = jest.fn();
        l.log(ctx);
        expect(l._write).toHaveBeenCalledTimes(1);
        expect(JSON.parse(l._write.mock.calls[0])).toStrictEqual(expect.objectContaining({
            ...logObj,
            // Couldn't determine which version this came in, so it's possible you'll get a test
            // failure here related to your version of Node. Try adjusting the version.
            msg: process.versions.node.split('.')[0] >= 14
                ? '<ref *1> { ctx: [Circular *1] }'
                : '{ ctx: [Circular] }'
        }));
    });

    test('child loggers inherit parent opts', () => {
        const l = new Logger();
        const k = l.push({});
        expect(l.opts).toEqual(k.opts);
    });
});

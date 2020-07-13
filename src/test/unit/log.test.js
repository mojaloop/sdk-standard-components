const { Logger } = require(`${__ROOT__}/lib/logger`);

describe('Logger', () => {
    // From https://stackoverflow.com/a/14322189
    const iso8601regex = /^([+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([.,]\d+(?!:))?)?(\17[0-5]\d([.,]\d+)?)?([zZ]|([+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;
    const logObj = {
        msg: expect.any(String),
        ts: expect.stringMatching(iso8601regex),
        ctx: expect.any(Object),
    };

    test('should construct', () => {
        new Logger();
    });

    test('should log correctly', () => {
        const msg = 'test message';
        const l = new Logger();
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
        const l = new Logger({ opts: { levels: data.map(d => d.level) } });
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

    test('added context should be printed on the child', () => {
        const l = new Logger();
        l._write = jest.fn();
        const ctx = { test: 'data' };
        const k = l.push(ctx);
        k._write = jest.fn();
        k.log('hello');
        expect(k._write).toHaveBeenCalledTimes(1);
        expect(JSON.parse(k._write.mock.calls[0])).toStrictEqual(expect.objectContaining({ ...logObj, ctx }));
    });

    test('added context should not mutate the logger, and should only be printed on the child', () => {
        const l = new Logger();
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
        const l = new Logger();
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

    test('key clashes in context should throw an error', () => {
        const l = new Logger();
        const ctx = { test: 'data' };
        expect(() => l.push(ctx).push(ctx)).toThrow('Key already exists in logger');
    });

    test('circular references should be handled correctly in context', () => {
        const l = new Logger();
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
        const l = new Logger();
        let ctx = {};
        ctx.ctx = ctx;
        l._write = jest.fn();
        l.log(ctx);
        expect(l._write).toHaveBeenCalledTimes(1);
        expect(JSON.parse(l._write.mock.calls[0])).toStrictEqual(expect.objectContaining({
            ...logObj,
            msg: '{ ctx: [Circular] }',
        }));
    });

    test('child loggers inherit parent opts', () => {
        const l = new Logger();
        const k = l.push({});
        expect(l.opts).toEqual(k.opts);
    });
});

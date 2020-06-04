// An immutable structured logger.
//
// JSON.stringify blocks the event loop. At the time of writing, performance/responsiveness were
// not requirements of this module. If this is later required, see the discussion here for
// solutions: https://nodejs.org/en/docs/guides/dont-block-the-event-loop/. This may necessitate
// either a print queue, or a print sequence number to help identify print order. This could be
// optional in the constructor options.

// This logger could be considered immutable for the following two reasons. However, it could
// retain that property and simply return a new logger from a 'pop' or 'replace' method.
// 1) At the time of writing, this class does not implement any mechanism to remove any logging
//    context. This was a conscious decision to enable better reasoning about logging. "This logger
//    is derived from that logger, therefore the context must be a non-strict superset of the
//    context of the parent logger". However, this is something of an experiment, and at some time
//    in the future may be considered an impediment, or redundant, and the aforementioned mechanism
//    (e.g. a pop method) may be added.
// 2) No 'replace' method (or method for overwriting logged context) has been implemented. This is
//    for the same reason no 'pop' method has been implemented.

const util = require('util');

const safeStringify = require('fast-safe-stringify');

// Utility functions

const replaceOutput = (_, value) => {
    if (value instanceof Error) {
        // If the error has a stack represented as a new-line delimited string, turn it into an
        // array for easier consumption.
        if (value.stack && (typeof value.stack === 'string')) {
            // Note that this will only modify our local copy of value.stack
            value.stack = value.stack.split('\n').map(line => line.trim());
        }
        return Object
            .getOwnPropertyNames(value)
            .reduce((acc, objectKey) => ({ ...acc, [objectKey]: value[objectKey] }), {});
    }
    if (value instanceof RegExp) {
        return value.toString();
    }
    if (value instanceof Function) {
        return `[Function: ${value.name || 'anonymous'}]`;
    }
    return value;
};

// space
//   String | Number
//   The default formatting to be supplied to the JSON.stringify method. Examples include the
//   string '\t' to indent with a tab and the number 4 to indent with four spaces. The default,
//   undefined, will not break lines.
//   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#Parameters
// printTimestamp
//   Boolean
//   Whether to print a timestamp.
// timestampFmt
//   Function
//   A function that accepts a Date object and produces a timestamp string.
// stringify
//   Function
//   The function that will eventually perform the stringifying. Will be called with the same
//   signature as JSON.stringify.
const buildStringify = ({
    space = 2,
    printTimestamp = true,
    timestampFmt = (ts => ts.toISOString()),
    stringify = safeStringify,
} = {}) => {
    return ({ ctx, msg, level = undefined }) => {
        const ts = printTimestamp ? timestampFmt(new Date()) : undefined;
        return stringify({ ts, level, msg, ctx, }, replaceOutput, space);
    };
};

const contextSym = Symbol('Logger context symbol');

// Logger- main functionality

class Logger {
    // context
    //   Object
    //   Context data to preload in the logger. Example: { path: '/users', method: 'GET' }
    //   This logger and all loggers derived from it (with the push method) will print this context
    //   If any reserved keys exist in the new object, an error will be thrown.
    // stringify
    //   Function
    //   Supply a function to perform stringifying.
    //   Function signature: f(dataToStringify).
    // opts.copy
    //   The function to copy the context object to a new instance of this logger. Allows deep
    //   copy, use of immutable libs etc.
    //   Function signature: f(orig) => copy.
    //   Default: identity function.
    // opts.allowContextOverwrite
    //   Allow context keys to be overwritten in copied Logger objects
    // opts.levels
    //   Alias methods to support log levels. Will call the `.log` method with top-level key
    //   "level" equal to the value supplied below. E.g. providing the argument ['verbose'] to the
    //   opts.levels parameter results in a method `.verbose` on the logger that logs thus:
    //   { msg, ctx, level: 'verbose' }
    constructor({
        context = {},
        stringify = buildStringify(),
        opts: {
            allowContextOverwrite = false,
            copy = o => o,
            levels = ['verbose', 'debug', 'warn', 'error', 'trace', 'info', 'fatal'],
        } = {},
    } = {}) {
        this[contextSym] = context;
        this.configure({
            stringify,
            opts: {
                allowContextOverwrite,
                copy,
                levels,
            }
        });
    }

    // Update logger configuration.
    // opts
    //   Object. May contain any of .stringify, .opts.
    //   See constructor comment for details
    configure({
        stringify = this.stringify,
        opts = this.opts,
    }) {
        this.stringify = stringify;
        this.opts = { ...this.opts, ...opts };
        this.opts.levels.forEach(level => {
            this[level] = (...args) => {
                this._log(level, ...args);
            };
        });
    }

    // Create a new logger with the same context as the current logger, and additionally any
    // supplied context.
    // context
    //   An object to log. Example: { path: '/users', method: 'GET' }
    //   If allowContextOverride is false and a key in this object already exists in this logger,
    //   an error will be thrown.
    push(context) {
        if (!context) {
            return this;
        }
        if (typeof context !== 'object') {
            throw new Error('Context must be a POJO. Instead of .push(x) use .push({ x })');
        }
        // Check none of the new context replaces any of the old context
        const arrayIntersection = (a1, a2) => a1.filter(v => a2.includes(v));
        const objKeysIntersection = (o1, o2) => arrayIntersection(Object.keys(o1), Object.keys(o2));
        if (!this.allowContextOverwrite &&
            objKeysIntersection(context, this[contextSym]).length > 0
        ) {
            throw new Error('Key already exists in logger');
        }
        return new Logger({
            context: {
                ...this.opts.copy(this[contextSym]),
                ...context
            },
            stringify: this.stringify,
            opts: this.opts,
        });
    }

    // Log to stdout.
    // args
    //   Any type is acceptable. All arguments will be passed to util.format, then printed as the
    //   'msg' property of the logged item.
    log(...args) {
        this._log(undefined, ...args);
    }

    _log(level, ...args) {
        const msg = args.length > 0 ? util.format(...args) : undefined;
        const output = this.stringify({ ctx: this[contextSym], msg, level, });
        this._write(output);
    }

    // Separate method to enable testing
    _write(msg) {
        if (msg != '') {
            process.stdout.write(msg + '\n');
        }
    }
}

module.exports = {
    Logger,
    buildStringify,
};

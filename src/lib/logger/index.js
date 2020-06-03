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

// TODO:
// - just call the logger to add a message property and log that- pass all arguments to util.format
// - directly support env var config, perhaps using "namespaced" env vars, e.g. EL_LOGGER_$VAR? Or
//   require that the user of this lib passes config through? (Allow the user to configure whether
//   we do this? Or just provide them some support function to pass their process.env to if they
//   want to support it? I.e. `new Logger(generateLoggerOpts(process.env))`
// - we should stream to transports, which should themselves probably be streams

// TODO:
// Is it possible to pretty-print log messages or strings containing new-line characters? For
// example, instead of printing the '\n' characters in a stack-trace, actually printing the
// new-line characters. Is that possible and/or worthwhile?

const util = require('util');

const safeStringify = require('fast-safe-stringify');

const transportsExport = require('./transports');

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
    // transports
    //   Array of functions
    //   Each function will be supplied with arguments (String msg, Date timestamp) for each log
    //   event.
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
        transports = [],
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
            transports,
            opts: {
                allowContextOverwrite,
                copy,
                levels,
            }
        });
    }

    // Update logger configuration.
    // opts
    //   Object. May contain any of .transports, .stringify, .opts.
    //   See constructor comment for details
    configure({
        transports = this.transports,
        stringify = this.stringify,
        opts = this.opts,
    }) {
        this.transports = transports;
        this.stringify = stringify;
        this.opts = { ...this.opts, ...opts };
        this.opts.levels.forEach(level => {
            this[level] = async (...args) => {
                this._log(level, ...args);
            }
        })
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
            transports: this.transports,
            stringify: this.stringify,
            opts: this.opts,
        });
    }

    // Log to transports.
    // args
    //   Any type is acceptable. All arguments will be passed to util.format, then printed as the
    //   'msg' property of the logged item.
    async log(...args) {
        await this._log(undefined, ...args);
    }

    async _log(level, ...args) {
        // NOTE: if printing large strings, JSON.stringify will block the event loop. This, and
        // solutions, are discussed here:
        // https://nodejs.org/en/docs/guides/dont-block-the-event-loop/.
        // At the time of writing, this was considered unlikely to be a problem, as this
        // implementation did not have any performance requirements
        // TODO: stream json to streams?
        const msg = args.length > 0 ? util.format(...args) : undefined;
        const output = this.stringify({ ctx: this[contextSym], msg, level, });
        await Promise.all(this.transports.map(t => t(output)));
    }
}

module.exports = {
    Logger,
    transports: transportsExport,
    buildStringify,
};

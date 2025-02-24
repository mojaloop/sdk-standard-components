const colorMap = Object.freeze({
    fatal: 91,
    error: 31,
    warn: 93,
    info: 92,
    verbose: 96,
    debug: 34,
    trace: 97
});

const colorize = (level) => {
    if (!colorMap[level]) return level;
    return `\u001b[${colorMap[level]}m${level}\u001b[0m`;
};

const logLevels = Object.keys(colorMap);

module.exports = {
    colorize,
    logLevels
};

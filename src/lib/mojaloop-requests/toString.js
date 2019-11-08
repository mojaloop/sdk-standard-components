
module.exports = function toString(obj) {
    if (typeof obj === 'string' || Buffer.isBuffer(obj))
        return obj;
    if (typeof obj === 'number')
        return obj.toString();
    return JSON.stringify(obj);
};

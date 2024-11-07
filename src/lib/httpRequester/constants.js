const ResponseType = Object.freeze({
    ArrayBuffer: 'arraybuffer',
    JSON:  'json',
    Text: 'text',
    Stream: 'stream',
    // Document: 'document', // this available in axios
});

module.exports = {
    ResponseType,
};

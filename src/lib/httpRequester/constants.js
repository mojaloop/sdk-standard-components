const ResponseType = Object.freeze({
    ArrayBuffer: 'arraybuffer',
    JSON:  'json',
    Text: 'text',
    Stream: 'stream',
    // Document: 'document', // this available in axios
});

const DEFAULT_TIMEOUT = 65_000; // there's lots of callback/request timeouts in TTK with 60_000 ms
const DEFAULT_RETRIES = 3;
// todo: add possibility to override these defaults with env vars

module.exports = {
    ResponseType,
    DEFAULT_TIMEOUT,
    DEFAULT_RETRIES,
};

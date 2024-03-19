const { EventEmitter } = require('node:events');
const request = require('../../../src/lib/request');

const mockReq = new EventEmitter();
mockReq.end = jest.fn();

const mockRes = new EventEmitter();
mockRes.headers = {};
mockRes.statusCode = 401;

let mockCb;

jest.mock('http', () => ({
    ...jest.requireActual('http'),
    request: jest.fn((reqOpts, cb) => {
        mockCb = cb;
        return mockReq;
    }),
}));

describe('request Tests -->', () => {
    test('should throw error on wrong content-type, and pass original statusCode', async () => {
        const sentRequest = request({ uri: 'http://test.com' }).catch(e => e);
        mockCb(mockRes);
        setTimeout(() => {
            mockRes.emit('data', Buffer.from('test data'));
            mockRes.emit('end');
        }, 10);

        const err = await sentRequest;
        expect(err).toBeInstanceOf(Error);
        expect(err.message.startsWith('Invalid content-type')).toBe(true);
        expect(err.statusCode).toBe(mockRes.statusCode);
    });
});

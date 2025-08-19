/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 * Kevin Leyow <kevin.leyow@infitx.com>

 --------------
 ******/

const { sanitizeRequest, sanitizeError } = require('../../../src/lib/sanitize');

describe('sanitizeRequest', () => {
    it('should redact Authorization header', () => {
        const req = { headers: { Authorization: 'Bearer secret', foo: 'bar' } };
        const sanitized = sanitizeRequest(req);
        expect(sanitized.headers.Authorization).toBe('[REDACTED]');
        expect(sanitized.headers.foo).toBe('bar');
    });

    it('should redact httpAgent and httpsAgent', () => {
        const req = { httpAgent: {}, httpsAgent: {}, headers: {} };
        const sanitized = sanitizeRequest(req);
        expect(sanitized.httpAgent).toBe('[REDACTED]');
        expect(sanitized.httpsAgent).toBe('[REDACTED]');
    });

    it('should not mutate the original request object', () => {
        const req = { headers: { Authorization: 'secret' }, httpAgent: {}, httpsAgent: {} };
        const copy = { ...req, headers: { ...req.headers } };
        sanitizeRequest(req);
        expect(req).toEqual(copy);
    });

    it('should handle missing headers gracefully', () => {
        const req = { foo: 'bar' };
        const sanitized = sanitizeRequest(req);
        expect(sanitized.foo).toBe('bar');
    });

    it('should return input if not an object', () => {
        expect(sanitizeRequest(null)).toBe(null);
        expect(sanitizeRequest('string')).toBe('string');
        expect(sanitizeRequest(123)).toBe(123);
    });
});

describe('sanitizeError', () => {
    it('should redact Authorization in err.config.headers', () => {
        const err = { config: { headers: { Authorization: 'secret', foo: 'bar' } } };
        sanitizeError(err);
        expect(err.config.headers.Authorization).toBe('[REDACTED]');
        expect(err.config.headers.foo).toBe('bar');
    });

    it('should redact httpAgent and httpsAgent in err.config', () => {
        const err = { config: { httpAgent: {}, httpsAgent: {} } };
        sanitizeError(err);
        expect(err.config.httpAgent).toBe('[REDACTED]');
        expect(err.config.httpsAgent).toBe('[REDACTED]');
    });

    it('should redact Authorization in err.originalRequest.headers', () => {
        const err = { originalRequest: { headers: { Authorization: 'secret' } } };
        sanitizeError(err);
        expect(err.originalRequest.headers.Authorization).toBe('[REDACTED]');
    });

    it('should redact httpAgent and httpsAgent in err.originalRequest', () => {
        const err = { originalRequest: { httpAgent: {}, httpsAgent: {} } };
        sanitizeError(err);
        expect(err.originalRequest.httpAgent).toBe('[REDACTED]');
        expect(err.originalRequest.httpsAgent).toBe('[REDACTED]');
    });

    it('should redact err.request field', () => {
        const err = { request: { some: 'data' } };
        sanitizeError(err);
        expect(err.request).toBe('[REDACTED]');
    });

    it('should redact Authorization in err.response.config.headers', () => {
        const err = { response: { config: { headers: { Authorization: 'secret' } } } };
        sanitizeError(err);
        expect(err.response.config.headers.Authorization).toBe('[REDACTED]');
    });

    it('should redact httpAgent and httpsAgent in err.response.config', () => {
        const err = { response: { config: { httpAgent: {}, httpsAgent: {} } } };
        sanitizeError(err);
        expect(err.response.config.httpAgent).toBe('[REDACTED]');
        expect(err.response.config.httpsAgent).toBe('[REDACTED]');
    });

    it('should handle missing fields gracefully', () => {
        const err = { foo: 'bar' };
        sanitizeError(err);
        expect(err.foo).toBe('bar');
    });

    it('should return input if not an object', () => {
        expect(sanitizeError(null)).toBe(null);
        expect(sanitizeError('string')).toBe('string');
        expect(sanitizeError(123)).toBe(123);
    });
});

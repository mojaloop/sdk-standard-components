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
 - Name Surname <name.surname@mojaloop.io>

 * ModusBox
 - Murthy Kakarlamudi - murthy@modusbox.com - ORIGINAL AUTHOR

 --------------
 ******/

const Common = require('../../../../src/lib/requests/common');

describe('Common', () => {

    test('pass if content-length is not populated in incoming http response', async () => {
        const response = {
            statusCode: 200,
            headers: {
                'content-type': 'application-json'
            },
            body: ''
        };
        await Common.throwOrJson(response);
    });

    test('throw an error if content-length is greater than 0', async () => {
        try {
            const response = {
                statusCode: 200,
                headers: {
                    'content-length': 10
                },
                body: ''
            };
            await Common.throwOrJson(response);

        } catch (error) {
            expect(error.message).toBe('Expected empty response body but got content: ');
        }
    });

    test('throw an error if response code is <200', async () => {
        try {
            const response = {
                statusCode: 100,
                headers: {
                    'content-length1': 0
                },
                body: ''
            };
            await Common.throwOrJson(response);

        } catch (err) {
            expect(err.message).toBe('Request returned non-success status code 100');
        }
    });

    describe('formatEndpointOrDefault', () => {
        it('returns the default when endpoint is null', () => {
            // Arrange
            // Act
            const result = Common.formatEndpointOrDefault(null, 'http', 'http://example.com');

            // Assert
            expect(result).toBe('http://example.com');
        });

        it('returns the default when endpoint is undefined', () => {
            // Arrange
            // Act
            const result = Common.formatEndpointOrDefault(undefined, 'http', 'http://example.com');

            // Assert
            expect(result).toBe('http://example.com');
        });

        it('returns the default when transportScheme is null', () => {
            // Arrange
            // Act
            const result = Common.formatEndpointOrDefault('als.com', null, 'http://example.com');

            // Assert
            expect(result).toBe('http://example.com');
        });

        it('returns the default when transportScheme is undefined', () => {
            // Arrange
            // Act
            const result = Common.formatEndpointOrDefault('als.com', undefined, 'http://example.com');

            // Assert
            expect(result).toBe('http://example.com');
        });

        it('returns the formatted endpoint', () => {
            // Arrange
            // Act
            const result = Common.formatEndpointOrDefault('als.com', 'https', 'http://example.com');

            // Assert
            expect(result).toBe('https://als.com');
        });

        it('throws an error when no endpoint and no default endpoint are set', () => {
            // Arrange
            // Act
            const action = () => Common.formatEndpointOrDefault('als.com');

            // Assert
            expect(action).toThrowError('defaultEndpoint must be set');
        });
    });
});

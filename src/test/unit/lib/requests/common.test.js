/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Murthy Kakarlamudi - murthy@modusbox.com                             *
 **************************************************************************/

const Common = require('../../../../lib/requests/common');

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

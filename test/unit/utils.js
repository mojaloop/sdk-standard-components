const axios = require('axios');
const AxiosMockAdapter = require('axios-mock-adapter');

const mockAxios = new AxiosMockAdapter(axios);

const mockGetReply = ({
    route,
    statusCode = 200,
    data = {},
    headers = jsonContentTypeHeader,
} = {}) => mockAxios.onGet(route).reply(statusCode, data, headers);

const jsonContentTypeHeader = Object.freeze({ 'content-type': 'application/json' });

module.exports = {
    // IMPORTANT:  mockAxios should be imported in tests BEFORE any httpRequester functions
    mockAxios,
    mockGetReply,
    jsonContentTypeHeader,
};


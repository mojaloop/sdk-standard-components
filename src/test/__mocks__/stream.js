

const streamActual = jest.requireActual('stream');
const { Writable } = jest.genMockFromModule('stream');

//Override the Writable
streamActual.Writable = Writable;

Writable.write = jest.fn(() => {});


module.exports = streamActual;



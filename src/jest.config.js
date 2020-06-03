const path = require('path')

module.exports = {
  verbose: true,
  globals: {
    __ROOT__: path.resolve(__dirname)
  }
}

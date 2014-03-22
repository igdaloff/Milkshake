// Bundle all our routes into a hash so we don't have to manually require all route files
var require_directory = require('require-directory');
module.exports = require_directory(module);
var root = require('path').normalize(__dirname + '/../');
console.log(root);
module.exports = {
  production: {
    root: root
  }
};
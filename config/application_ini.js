var root = require('path').normalize(__dirname + '/../');
console.log(root);
module.exports = {
  production: {
    app: {
      baseUrl: "http://milkshake.mu",
      alternativeUrls: ["www.milkshake.mu"],
      port: 80,
      httpAuth: false,
      sessionName: "mkshh",
      sessionSecret: "njxmumfmtwfddjymypoy5hfkhn"
    },
    root: root
  },
  staging: {
    app: {
      baseUrl: "http://staging.milkshake.mu",
      alternativeUrls: ["staging.milkshake.mu"],
      port: 80,
      httpAuth: true,
      sessionName: "mkshh",
      sessionSecret: "vgehkehkvlnbgynnuufghxptjx"
    },
    root: root
  },
  development: {
    app: {
      baseUrl: "http://local.milkshake.mu",
      alternativeUrls: ["local.milkshake.mu"],
      port: 3000,
      httpAuth: false,
      sessionName: "mkshh",
      sessionSecret: "xyixmpgzifksqpvsczavphglaz",
      databaseUrl: 'mongodb://127.0.0.1/milkshake',
    },
    root: root
  }
};
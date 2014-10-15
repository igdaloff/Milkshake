var root = require('path').normalize(__dirname + '/../');
console.log(root);
module.exports = {
  production: {
    app: {
      baseUrl: "http://milkshake.mu",
      alternativeUrls: ["www.milkshake.mu"],
      port: process.env.PORT,
      httpAuth: false,
      sessionName: "mkshh",
      sessionSecret: "njxmumfmtwfddjymypoy5hfkhn",
      databaseUrl: process.env.MONGO_URL,
      socketPort: 1337,
      splashPage: false
    },
    root: root
  },
  staging: {
    app: {
      baseUrl: "http://staging.milkshake.mu",
      alternativeUrls: ["staging.milkshake.mu"],
      port: process.env.PORT,
      httpAuth: false,
      sessionName: "mkshh",
      sessionSecret: "vgehkehkvlnbgynnuufghxptjx",
      databaseUrl: process.env.MONGO_URL,
      socketPort: 80,
      splashPage: false
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
      socketPort: 1338,
      splashPage: false
    },
    root: root
  }
};
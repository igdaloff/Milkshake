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
      databaseUrl: "mongodb://milkshake:b76e497917c6da5662a628c0b070ff61@candidate.40.mongolayer.com:10318,candidate.43.mongolayer.com:10005/milkshake_prod",
      databaseUser: "milkshake_prod",
      databasePassword: "Nr.t-Xqs9]7xdZdsYjP-ALJK)ce~.&",
      socketPort: 1338,
      splashPage: false
    },
    root: root
  },
  staging: {
    app: {
      baseUrl: "http://staging.milkshake.mu",
      alternativeUrls: ["staging.milkshake.mu"],
      port: process.env.PORT,
      httpAuth: true,
      sessionName: "mkshh",
      sessionSecret: "vgehkehkvlnbgynnuufghxptjx",
      databaseUrl: process.env.MONGO_URL,
      socketPort: 1337,
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
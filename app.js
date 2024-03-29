/*
============================================
Dependencies
============================================
*/
var swig = require('swig');
var express = require("express");
var auth = require('http-auth');
var app = express();
var env = process.env.NODE_ENV || 'development'
var config = require('./config/config').Config;

global.config = config;

/*
============================================
501 Auth protection
============================================
*/
if (config.app.httpAuth) {
  basic = auth.basic({
    realm: "milkshake",
    file: "./config/users.htpasswd"
  });
  app.use(auth.connect(basic));
}
/*
============================================
Database
============================================
*/
var mongoose = require('mongoose')
mongoose.connect(config.app.databaseUrl);

/*
============================================
Session
============================================
*/
app.use(express.cookieParser());
app.use(express.session({
  secret: 'D1EmzMimx43inX1qVreaaF5RJEawEeH'
}));

/*
============================================
Server
============================================
*/
var port = config.app.port || 3000;
var server = app.listen(port);
console.log('Express app started on port', port, 'under"', env, '" environment.');

app.configure(function(){

  // Set up the template engine
  app.engine('html', swig.renderFile);
  app.set('view engine', 'html');
  app.set('views', __dirname + '/app/views');
  app.set('view cache', false);
  swig.setDefaults({ 
    cache: false,
    locals: {
      env: env,
      baseUrl: config.app.baseUrl
    }
  });
  // Serve static files from /public
  app.use(express.static(__dirname + "/public"));
  // Use URLencoded for post data
  app.use(express.urlencoded());
});


var routes = require("./config/routes")(app);
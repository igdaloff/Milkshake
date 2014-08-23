/*
============================================
Dependencies
============================================
*/
var swig = require('swig');
var express = require("express");


var env = process.env.NODE_ENV || 'development'
var config = require('./config/config').Config;

global.config = config;


/*
============================================
Server
============================================
*/
var app = express();
var server = app.listen(3000);
console.log("Express server listening on port 3000");

app.configure(function(){

  // Set up the template engine
  app.engine('html', swig.renderFile);
  app.set('view engine', 'html');
  app.set('views', __dirname + '/app/views');
  app.set('view cache', false);
  swig.setDefaults({ cache: false });
  // Serve static files from /public
  app.use(express.static(__dirname + "/public"));
  // Use URLencoded for post data
  app.use(express.urlencoded());
});


var routes = require("./config/routes")(app);
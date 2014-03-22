/*
============================================
Dependencies
============================================
*/
var routes = require("./routes");
var swig = require('swig');

/*
============================================
Server
============================================
*/
var express = require("express");
var app = express();
var server = app.listen(3000);
console.log("Express server listening on port 3000");

app.configure(function(){

  // Set up the template engine
  app.engine('html', swig.renderFile);
  app.set('view engine', 'html');
  app.set('views', __dirname + '/views');
  app.set('view cache', false);
  swig.setDefaults({ cache: false });
  // Serve static files from /public
  app.use(express.static(__dirname + "/public"));
  // Use URLencoded for post data
  app.use(express.urlencoded());
});
/*
============================================
Routes
============================================
*/

app.get("/", routes.home.home);
app.get("/search", routes.search.search_by_string);
app.get("/new-playlist", routes.playlist.new_playlist);
app.post("/process-new-playlist/", routes.playlist.process_new_playlist);
app.get("/playlist/:id", routes.playlist.playlist);
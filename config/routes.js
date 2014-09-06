var home = require(config.root + "app/controllers/home");
var search = require(config.root + "app/controllers/search");
var playlist = require(config.root + "app/controllers/playlist");

/*
============================================
Routes
============================================
*/

module.exports = function (app) {

  app.get("/", playlist.new_playlist);
  app.get("/search", search.search_by_string);
  app.post("/process-new-playlist/", playlist.process_new_playlist);
  app.get("/playlist/:id", playlist.playlist);
};
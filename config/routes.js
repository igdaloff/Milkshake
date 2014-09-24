var home = require(config.root + "app/controllers/home");
var search = require(config.root + "app/controllers/search");
var playlist = require(config.root + "app/controllers/playlist");

/*
============================================
Routes
============================================
*/

module.exports = function (app) {

  app.get("/", home.home);
  app.get("/search", search.searchByString);
  app.post("/process-new-playlist/", playlist.processNewPlaylist);
  app.get("/:id", playlist.playlist);
  app.use(function(req, res, next){
    res.status(404);

    // respond with html page
    if (req.accepts('html')) {
      res.render('404', { url: req.url });
      return;
    }

    // respond with json
    if (req.accepts('json')) {
      res.send({ error: 'Not found' });
      return;
    }

    // default to plain-text. send()
    res.type('txt').send('Not found');
  });
};
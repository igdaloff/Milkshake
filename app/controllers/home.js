exports.home = function(req, res) {

  // Show the splash page if this is Production
  if(config.app.splashPage) {

    res.render('splash');  
  }
  else {

    var shortId = require('shortid');
    var newPlaylistId = shortId.generate();
    req.session.newPlaylistId = newPlaylistId;
    res.render('new-playlist', newPlaylistId);
  }
};

/**
 * Robots
 * If this is the production environment, allow crawling of everything
 * Otherwise disable crawling
 */
exports.robots = function(req, res) {

  var robots;
  res.set('Content-Type', 'text/plain');
  if(process.env.NODE_ENV === 'production') {

    robots = 'User-agent: *\nDisallow:';
  }
  else {

    robots = 'User-agent: *\nDisallow: /';
  }
  res.send(robots);
};
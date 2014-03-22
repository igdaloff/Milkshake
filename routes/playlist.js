var Playlist = require("../models/playlist.js");

exports.new_playlist = function(req, res){

  res.render("new-playlist");
};

exports.process_new_playlist = function(req, res){
  console.log(req.body);
  // Build the new playlist object from the POST data
  var newPlaylist = {
    title: req.body.title,
    created: Date.now()
  }
  var totalDuration = 0;
  // Get the track info (0, 1, 2)
  var playlistTracks = [];
  for(var i = 0; i <= 2; i++){
    var track = {
      trackId: req.body["track" + i + "id"],
      source: req.body["track" + i + "source"],
      title: req.body["track" + i + "title"],
      url: req.body["track" + i + "url"],
      artwork: req.body["track" + i + "artwork"],
      duration: parseFloat(req.body["track" + i + "duration"]),
    }
    console.log(track.duration);
    totalDuration += track.duration;
    playlistTracks.push(track);
  }

  newPlaylist.tracks = playlistTracks;
  newPlaylist.totalDuration = totalDuration;

  // Write it to the database, then redirect to that track page
  var playlistRow = new Playlist(newPlaylist);

  playlistRow.save(function (err) {

    if (err){
      console.log(err);
      return err;
    }
    res.redirect("/playlist/" + playlistRow._id);
  });
}

exports.playlist = function(req, res){

  var io = require('socket.io').listen(1337);

  io.sockets.on('connection', function (socket) {
    socket.emit('userConnect', { userCount: io.sockets.clients().length });
  });

  Playlist.findById(req.params.id, "-tracks._id", function(err, playlist){
    
    if (err){
      console.log(err);
      return err;
    }
    res.render("playlist", playlist);
  });
}
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
  var usersReady = [];

  io.sockets.on('connection', function (socket) {

    console.log('someone connected! Users now:', io.sockets.clients().length);
    io.sockets.emit('userConnect', {
      userCount: io.sockets.clients().length
    });

    socket.on('userReady', function () {

      console.log("new user", socket.id);
      if(usersReady.indexOf(socket.id) === -1) {

        usersReady.push(socket.id);
      }
      console.log("A user is ready. Number of users ready:", usersReady.length);

      // If both users are ready, emit the go event
      if(usersReady.length === 2) {

        io.sockets.emit("bothUsersReady");
      }
    });

    socket.on('disconnect', function() {

      if(usersReady.indexOf(socket.id) !== -1) {

        usersReady.splice(socket.id, 1);
      }
      
      io.sockets.emit('userDisconnect', {
        userCount: io.sockets.clients().length
      });

      console.log("A user disconnected. Number of users ready:", usersReady.length);
    });
  });



  Playlist.findById(req.params.id, "-tracks._id", function(err, playlist){
    
    if (err){
      console.log(err);
      return err;
    }
    res.render("playlist", playlist);
  });
}
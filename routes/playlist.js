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

// Socket stuff here

var io = require('socket.io').listen(1337);

io.sockets.on('connection', function (socket) {

  console.log('someone connected! Users now:', io.sockets.clients().length, "socket url:", socket.handshake.url);

  // Add the user to a room based on the playlist ID
  socket.on('join room', function (playlistId) {

    socket.set('roomId', playlistId, function() {
      console.log("User joined the room", playlistId);
    });
    socket.join(playlistId);

    io.sockets.in(playlistId).emit('userConnect', {
      userCount: io.sockets.clients().length
    });

    console.log("users in this room:", io.sockets.clients(playlistId).length);
  });

  socket.on('userReady', function () {

    socket.isReady = true;

    var usersReady = [];

    socket.get('roomId', function(err, roomId) {

      var clientsInRoom = io.sockets.clients(roomId);

      // Loop over the clients in this room and see who is ready
      for(var i = 0; i < clientsInRoom.length; i++) {

        var user = clientsInRoom[i];
        
        if(user.isReady) {

          usersReady.push(user.id);
        }
      }

      // If both users are ready, emit the go event
      if(usersReady.length === 2) {

        io.sockets.in(roomId).emit("bothUsersReady");
      }  
    });
  });
});

// End socket stuff

exports.playlist = function(req, res){

  Playlist.findById(req.params.id, "-tracks._id", function(err, playlist){

    if (err){
      console.log(err);
      return err;
    }
    playlist.host = req.headers.host.split(":")[0];
    res.render("playlist", playlist);
  });
}
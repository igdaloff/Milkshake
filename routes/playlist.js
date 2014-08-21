var Playlist = require('../models/playlist.js');

exports.new_playlist = function(req, res){

  res.render('new-playlist');
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
      trackId: req.body['track' + i + 'id'],
      source: req.body['track' + i + 'source'],
      title: req.body['track' + i + 'title'],
      url: req.body['track' + i + 'url'],
      artwork: req.body['track' + i + 'artwork'],
      duration: parseFloat(req.body['track' + i + 'duration']),
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
    res.redirect('/playlist/' + playlistRow._id);
  });
}

// Socket stuff here

var io = require('socket.io').listen(1337);

io.sockets.on('connection', function (socket) {

  var playlistStartTime = 0;

  console.log('someone connected! Users now:', io.sockets.clients().length, 'socket url:', socket.handshake.url);

  // Add the user to a room based on the playlist ID and tell the client what time they should load
  // the playlist from (based on any other users in the room)
  socket.on('joinRoom', function (roomId) {

    socket.roomId = roomId;
    console.log('User joined room');
    socket.join(roomId);

    var clientsInRoom = io.sockets.clients(socket.roomId);

    // Check if this is a reconnect event and the loadPlaylistFrom timestamp was set before
    for(var i = 0; i < clientsInRoom.length; i++) {

      var user = clientsInRoom[i];

      if(user.id !== socket.id && typeof user.playlistStartTime !== 'undefined') {

        playlistStartTime = user.playlistStartTime;
      }
    }

    // Emit the loadPlaylistFrom event telling the new client where to load from
    // If this is a first time request load from 0
    console.log('Emit the loadPlaylistFrom event');
    socket.emit('loadPlaylistFrom', {
      startTime: playlistStartTime
    });
  });

  socket.on('userReadyToPlay', function () {

    socket.isReady = true;

    var usersReady = [];
    var clientsInRoom = io.sockets.clients(socket.roomId);

    // If we've already started the playlist, just send the new user the go event
    if(playlistStartTime !== 0) {

      console.log('emit playPlaylist event to new user with timestamp', playlistStartTime);
      socket.emit('playPlaylist', {
        startTime: playlistStartTime
      });
      socket.playlistStartTime = playlistStartTime;
    }


    // Otherwise, check if both users are ready and if so emit the go event to everyone
    else {

      // Loop over the clients in this room and see who else is ready
      for(var i = 0; i < clientsInRoom.length; i++) {

        var user = clientsInRoom[i];

        if(user.isReady) {

          usersReady.push(user.id);
        }
      }

      if(usersReady.length === 2) {

        console.log('emit playPlaylist event to everyone');
        io.sockets.in(socket.roomId).emit('playPlaylist', {
          startTime: playlistStartTime
        });

        // Set the playlistStartTime to be now (current UNIX timestamp) if this is the first play
        if(playlistStartTime === 0) {

          var clientsInRoom = io.sockets.clients(socket.roomId);
          for(var i = 0; i < clientsInRoom.length; i++) {
            
            var user = clientsInRoom[i];
            user.playlistStartTime = Math.round(new Date().getTime() / 1000);
          }
        }
      }
    }  

  });

  // Notify the other users when someone disconnects
  socket.on('disconnect', function() {

    io.sockets.in(socket.roomId).emit('userLeft');
    console.log('other user disconnected');
  });
});

// End socket stuff

exports.playlist = function(req, res){

  Playlist.findById(req.params.id, '-tracks._id', function(err, playlist){

    if (err){
      console.log(err);
      return err;
    }
    playlist.host = req.headers.host.split(':')[0];
    res.render('playlist', playlist);
  });
}
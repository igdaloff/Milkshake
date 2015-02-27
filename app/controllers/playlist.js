var Playlist = require(config.root + 'app/models/playlist.js');
var Conversation = require(config.root + 'app/models/conversation.js');
var Time = require(config.root + 'lib/Time.js');
var sanitizeHtml = require('sanitize-html');

exports.processNewPlaylist = function(req, res){
  console.log(req.body);
  // Build the new playlist object from the POST data
  var playlistData = {
    title: req.body.title,
    created: Date.now()
  };
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
    };
    console.log(track.duration);
    totalDuration += track.duration;
    playlistTracks.push(track);
  }

  playlistData.tracks = playlistTracks;
  playlistData.totalDuration = totalDuration;

  addPlaylistRow(playlistData, function(playlistRow) {

    res.redirect('/' + playlistRow._id);
  });
};

// Socket stuff here

var io = require('socket.io').listen(config.app.socketPort);

io.sockets.on('connection', function (socket) {

  socket.emit("newConnectionId", socket.id);

  var playlistStartTime = 0;

  // Add the user to a room based on the playlist ID and tell the client what time they should load
  // the playlist from (based on any other users in the room)
  socket.on('joinRoom', function (playlistId) {

    socket.join(playlistId);
    socket.roomId = playlistId;

    var usersInRoom = io.sockets.adapter.rooms[playlistId];
    var numUsersInRoom = Object.keys(usersInRoom).length;

    console.log('User joined room', socket.roomId, ', number in room now:', numUsersInRoom);

    // If there are already more than two users connected, reject this connection
    if(numUsersInRoom > 2) {

      socket.emit('roomFull');
      socket.disconnect();
      return false;
    }

    // Notify other members that a user joined
    io.sockets.in(socket.roomId).emit('userJoined', numUsersInRoom);

    // Check if this is a reconnect event and the startTime timestamp was set before
    Playlist.findById(playlistId, 'startTime', function(err, docs) {

      if (err){
        console.log(err);
        return err;
      }
      if(typeof docs.startTime !== "undefined") {
        playlistStartTime = docs.startTime;
      }
      // Emit the loadPlaylistFrom event telling the new client where to load from
      // If this is a first time request load from 0
      console.log('Emit the loadPlaylistFrom event');
      socket.emit('loadPlaylistFrom', {
        startTime: playlistStartTime
      });
    });
  });

  socket.on('userReadyToPlay', function () {

    socket.isReady = true;

    var usersReady = 0;
    var usersInRoom = io.sockets.adapter.rooms[socket.roomId];

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
      for(var user in usersInRoom) {

        var client = io.sockets.connected[user];

        if(client.isReady) {

          usersReady++;
        }
      }

      if(usersReady === 2) {

        console.log('emit playPlaylist event to everyone');
        io.sockets.in(socket.roomId).emit('playPlaylist', {
          startTime: playlistStartTime
        });

        // Set the playlistStartTime to be now (current UNIX timestamp) if this is the first play
        if(playlistStartTime === 0) {

          var unixTS = Math.round(new Date().getTime() / 1000);

          // Save the start time to the database instance of this playlist
          Playlist.update({
            _id: socket.roomId
          }, {
            startTime: unixTS
          }, {
            multi: false
          }, function(err, numAffected) {

            console.log('rows updated:', numAffected);
            if (err){
              console.log(err);
              return err;
            }
          });
        }
      }
    }

  });

  // Notify the other users when someone disconnects
  socket.on('disconnect', function() {

    var numUsersInRoom = 0;
    var usersInRoom = io.sockets.adapter.rooms[socket.roomId];
    if(typeof usersInRoom === 'object') {

      numUsersInRoom = Object.keys(usersInRoom).length;
    }

    io.sockets.in(socket.roomId).emit('userLeft', numUsersInRoom);
  });

  // Message handling
  socket.on('newMessage', function(messageModel) {

    var cleanMessage = sanitizeHtml(messageModel.content);
    messageModel.content = cleanMessage;

    // Save the message to the Conversation in the DB
    Conversation.findOneAndUpdate({
      playlistId: socket.roomId
    }, {
      '$push': {
        messages: messageModel
      }
    }, function(err, model) {

      console.log('Message saved');
    });
    // Emit the message to all connected users
    io.sockets.in(socket.roomId).emit('newMessage', messageModel);
  });

  // User typing handling
  socket.on('userTyping', function(data) {

    io.sockets.in(socket.roomId).emit('userTyping', data);
  });

  socket.on('userNotTyping', function() {

    io.sockets.in(socket.roomId).emit('userNotTyping', {
      sender: socket.id
    });
  });

  socket.on('addTrack', function(newTrackData) {

    addTrackToPlaylist(socket.roomId, newTrackData, function(updatedPlaylistModel) {

      io.sockets.in(socket.roomId).emit('newTrack', updatedPlaylistModel);
    });
  });
  socket.on('removeTrack', removeTrackFromPlaylist);
});

// End socket stuff

exports.playlist = function(req, res){

  Playlist.findById(req.params.id, '-tracks._id', function(err, playlist){

    if (err){
      console.log(err);
    }

    if(playlist === null) {

      res.status(404);
      return res.render('404');
    }

    // Retreieve the conversation
    Conversation.findOne({
      playlistId: req.params.id
    }, '-messages._id -messages.timestamp', function(err, conversation) {

      if (err){
        console.log(err);
      }
      // Create the permalink to send to the page
      // Check to see if the playlist has already finished
      var currentUnixTime =  Math.round(new Date().getTime() / 1000);
      // Send the address and port that the client should use to connect to Socket.io
      var socketAddress = req.headers.host.split(':')[0] + ":" + config.app.socketPort;
      // Pass this in as a bool
      playlist.hasFinished = typeof playlist.startTime !== "undefined" && playlist.startTime + playlist.totalDuration < currentUnixTime;
      // Pass in the total time as a human-readable string
      playlist.totalTime = Time.secondsToMinutes(playlist.totalDuration);

      return res.render('playlist', {
        permalink: req.protocol + '://' + req.get('host') + req.originalUrl,
        playlist: playlist,
        conversation: conversation,
        socketAddress: socketAddress
      });
    });
  });
};

exports.createDummyPlaylist = function(req, res) {

  var currentUnixTime =  Math.round(new Date().getTime() / 1000);
  var playlistData = {
    title: 'Testing, testing, 1 2 3 4',
    startTime: currentUnixTime,
    tracks: [
      {
        trackId: '',
        source: 'youtube',
        title: 'Haddaway - What is Love + Lyrics',
        url: 'http://www.youtube.com/watch?v=K5G1FmU-ldg&feature=youtube_gdata',
        artwork: 'http://i.ytimg.com/vi/K5G1FmU-ldg/default.jpg',
        duration: 338
      },
      {
        trackId: '',
        source: 'youtube',
        title: 'Luke Million - Arnold',
        url: 'http://www.youtube.com/watch?v=XrvjwMIBtqA&feature=youtube_gdata',
        artwork: 'http://i.ytimg.com/vi/XrvjwMIBtqA/default.jpg',
        duration: 246
      },
      {
        trackId: '',
        source: 'youtube',
        title: 'Leggy Blonde - Flight Of The Conchords (Lyrics)',
        url: 'http://www.youtube.com/watch?v=7syyywL9JuM&feature=youtube_gdata',
        artwork: 'http://i.ytimg.com/vi/7syyywL9JuM/default.jpg',
        duration: 160
      }
    ],
    totalDuration: 744
  };

  addPlaylistRow(playlistData, function(playlistRow) {

    res.redirect('/' + playlistRow._id);
  });
};

/* 
 PRIVATE METHODS
*/

var addPlaylistRow = function(playlistData, cb) {

  // Write it to the database, then redirect to that track page
  var playlistRow = new Playlist(playlistData);

  playlistRow.save(function(err, playlist) {

    if (err){
      console.log(err);
      return err;
    }

    // Create a new conversation for the playlist
    var conversation = new Conversation({
      playlistId: playlist._id
    });

    conversation.save();

    // Call the callback
    if(typeof(cb) === 'function') {

      cb(playlistRow);
    }
  });
};

var addTrackToPlaylist = function(playlistId, trackData, cb) {

  console.log('track data to add:', trackData);
  var response;
  var trackObj = {
    trackId: trackData.trackId,
    source: trackData.source,
    title: trackData.title,
    url: trackData.url,
    artwork: trackData.artwork,
    duration: trackData.duration
  };

  // Save the track to the Playlist in the DB
  Playlist.findById(playlistId, function(err, playlist) {

    if(err) {

      console.log('Error adding track to ' + playlistId);
      response = {
        status: 'error',
        newTrackData: model
      };
      cb(response);
    }

    playlist.addTrackToPlaylist(trackObj, function(newTrackModel) {

      var response = {
        status: 'success',
        newTrackData: newTrackModel
      };
      cb(response);
    });
  });
};

var removeTrackFromPlaylist = function(playlistId, trackId, cb) {

  // Remove the track from the Playlist in the DB
  Playlist.findById(playlistId, function(err, playlist) {

    if(err) {

      console.log('Error removeing track from ' + playlistId);
      response = {
        status: 'error'
      };
      cb(response);
    }

    playlist.removeTrackFromPlaylist(trackId, function(model) {

      var response = {
        status: 'success',
        playlist: model
      };
      cb(response);
    });
  });
};
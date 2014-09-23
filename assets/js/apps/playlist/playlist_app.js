TWM.module('Playlist', function(Playlist, TWM, Backbone, Marionette, $, _){

  // prevent starting with parent
  this.startWithParent = false;

  /**
  * Bind Playlist UI
  *
  * Binds DOM elements to methods in the given playlistManager object
  *
  * @param playlistManager (obj) - A playlist manager object
  */
  var bindPlaylistUi = function(playlistManager){

    $('.playlist-toggle-play').on('click', function(){

      playlistManager.togglePlayPause();
      console.log('Now playing ' + playlistManager.getCurrentTrackData().title);
    });

    $('.playlist-next').on('click', function(){

      playlistManager.next();
      console.log('Now playing ' + playlistManager.getCurrentTrackData().title);
    });
    $('.playlist-prev').on('click', function(){

      playlistManager.previous();
      console.log('Now playing ' + playlistManager.getCurrentTrackData().title);
    });

    // Bind time updates to the progress bars
    $(playlistManager).on('timeupdate:track', function(event, currentTime){

      // Update the time in the header
      $(".current-time").text(TWM.Lib.secondsToMinutes(currentTime));

      var trackIndex = playlistManager.getCurrentTrackIndex();
      var trackData = playlistManager.getTrackData(trackIndex);
      $('.playlist-track').each(function(i) {

        var $progressBar = $(this).find('.current-progress');
        // Set the previous tracks duration to 100%
        if(i < trackIndex) {
          $progressBar.width('100%');
        }
        // Update the current track's progress
        else if(i == trackIndex) {

          var trackProgress = currentTime / trackData.duration * 100;
          $progressBar.width(trackProgress + '%');

          // requestAnimationFrame Shim
          (function() {
            var requestAnimationFrame = window.requestAnimationFrame ||
                                        window.mozRequestAnimationFrame ||
                                        window.webkitRequestAnimationFrame ||
                                        window.msRequestAnimationFrame;
                                        window.requestAnimationFrame = requestAnimationFrame;
          })();

          var canvas = document.querySelector('.progress-circle');
          var context = canvas.getContext('2d');
          var x = canvas.width / 2;
          var y = canvas.height / 2;
          var radius = 75;
          var endPercent = 105;
          var curPerc = currentTime;
          var circ = Math.PI * 2;
          var quart = Math.PI / 2;

          context.lineWidth = 2;
          context.strokeStyle = '#222';

          function animate(current) {
           context.clearRect(0, 0, canvas.width, canvas.height);
           context.beginPath();
           context.arc(x, y, radius, -(quart), ((circ) * current) - quart, false);
           context.stroke();
           if (curPerc <= endPercent) {
              requestAnimationFrame(function () {
                animate(curPerc / Math.PI)
              });
            }
          }

          animate();

        }
        // Everything else should be 0
        else {

          $progressBar.width(0);
        }
      });
    });
  }

  Playlist.API = {
    /**
    * Load Player
    *
    * Given a collection of playlist tracks, this function creates a new playlistManager object for controlling the playback of tracks
    *
    * @param playlist (obj) - A Backbone Collection containing the tracks to play
    * @return playlistManager (obj) - An object created from the playlistManager component class
    */
    loadPlayer: function(playlist){

      var tracks = [];
      for(key in playlist.models){

        var track = playlist.models[key];
        tracks.push(track.attributes);
      }
      var playlistManager = TWM.request('playlistManager:components', {
        tracks: tracks
      });
      return playlistManager;
    },
    /*
     * On User Connect
     * Handle the sending and receiving of socket messages
     */
    onUserConnect: function(socket) {

      // Pick up the socket ID when the server sends it to us
      socket.on('newConnectionId', function(socketId) {

        socket.id = socketId;
      });
      // If the room is full, perform an action to notify the user
      socket.on('roomFull', this.waitForRoom);
      // When the server tells us when to start loading the playlist from
      socket.on('loadPlaylistFrom', this.loadPlaylistFrom);
      // When the server sends the play event
      socket.on('playPlaylist', this.playPlaylist);
      // When the other user disconnects
      socket.on('userLeft', this.onUserLeft);

      // Set a request handler so we can get the active socket in future
      TWM.reqres.setHandler("playlist:activeSocket", function() {

        return socket;
      });
    },
    joinRoom: function() {
      
      var socket = TWM.request("playlist:activeSocket");
      socket.emit('joinRoom', playlist_id);
    },
    /*
     * Wait for room
     * If there are too many people in the room, notify the user and listen for other users disconnecting
     * When someone disconnects we will check how many users are still on and attempt a reconnect if it is only 1
     */
    waitForRoom: function() {

      var socket = TWM.request("playlist:activeSocket");
      alert('Room is full, waiting for space');
      socket.on('userLeft', this.joinRoom);

    },
    loadPlaylistFrom: function(data) {

      var socket = TWM.request("playlist:activeSocket");
      var playlist = TWM.request('playlist:activePlaylistMgr');
      var startTime = typeof data.startTime !== "undefined" ? data.startTime : 0;
      // work out if we are starting from the start (0) or resuming, and if resuming calculate where to resume from
      // based on what the server returned to us
      if(startTime !== 0) {

        startTime = Playlist.API.calculateTimeDiff(startTime);
        if(startTime > playlist.getPlaylistDuration()) {

          return false;
        }
      }
      playlist.loadFromTotalTime(startTime, function(track) {

        // Tell the server we are ready to start
        socket.emit('userReadyToPlay');
      });
    },
    playPlaylist: function(data) {

      var playlist = TWM.request('playlist:activePlaylistMgr');
      var startTime = data.startTime;
      // Account for any latency and get a fresh start time
      if(startTime === 0) {
        playlist.startPlaylist();
      }
      else {
        var timeDiff = Playlist.API.calculateTimeDiff(startTime);
        var updatedStartTime = playlist.getTrackFromTotalTime(timeDiff);
        playlist.playTrack(updatedStartTime.trackIndex, updatedStartTime.trackTime);
      }

      // Start the chat module
      Playlist.Chat.start();
    },
    onUserLeft: function() {

      // Do something here to notify the user when their partner has left
    },
    calculateTimeDiff: function(startTime) {

      var currentUnixTime =  Math.round(new Date().getTime() / 1000);
      var timeDiff = currentUnixTime - startTime;
      return timeDiff;
    }
  }

  Playlist.on('start', function(){

    var tracks = bootstrap || {};
    var playlist = TWM.request('newPlaylist:entities', tracks);
    // create a new playlist manager from the API.loadPlayer method
    var playlistManager = Playlist.API.loadPlayer(playlist);
    // bind controls to the new playlist manager object
    bindPlaylistUi(playlistManager);
    TWM.reqres.setHandler('playlist:activePlaylistMgr', function() {

      return playlistManager;
    });
  });
});
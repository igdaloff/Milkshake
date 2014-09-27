TWM.module("Playlist", function(Playlist, TWM, Backbone, Marionette, $, _){

  Playlist.Controller = {
    /**
     * Join room
     * Emit the request event to join playlist room to the server via socket
     */
    joinRoom: function() {

      var socket = TWM.request("playlist:activeSocket");
      socket.emit('joinRoom', playlistId);
    },
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
    /**
    * Bind Playlist UI
    *
    * Binds DOM elements to methods in the given playlistManager object
    *
    * @param playlistManager (obj) - A playlist manager object
    */
    bindPlaylistUi: function(playlistManager){

      var playlistManager = TWM.request('playlist:activePlaylistMgr');

      // Set the active track class ('current') when a track is playing or ends
      $(playlistManager).on('track:playing track:ended', this.setActiveTrackClass);
      // Bind time updates to the time and progress bar
      $(playlistManager).on('track:timeupdate', this.updateTimer);
      $(playlistManager).on('track:timeupdate', this.updateProgressBar);
    },
    /**
     * Save Socket ID
     * Set the ID returned from the server on the socket model and persist it to the localStorage array of
     * socket IDs that this user has connected with (each new page load will generate +1)
     */
    saveSocketId: function(socketId) {

      var socket = TWM.request("playlist:activeSocket");
      socket.id = socketId;
      // Save it to local storage if client supports it
      if (Modernizr.localstorage) {
        var socketIdsStr = localStorage.getItem("socketIds");
        // Parse the stringify'd array
        if(socketIdsStr !== null && socketIdsStr.length) {
          var socketIds = JSON.parse(socketIdsStr);
        }
        // If the socketIds array has not yet been created, add it in there
        if(typeof socketIds === "undefined" || socketIds === null) {

          socketIds = new Array();
        }
        socketIds.push(socketId)
        // Stringify the array again so we can save it in local storage
        socketIdsStr = JSON.stringify(socketIds);
        localStorage.setItem("socketIds", socketIdsStr);
        return socketIds;
      }
    },
    /**
     * Get socket history
     * Fetch the socketIds array from local storage if it exists, otherwise just return an array with the current
     * socket ID so we at least know the current socket connection
     */
    getSocketHistory: function() {

      var socketIds;
      if (Modernizr.localstorage) {
        var socketIdsStr = localStorage.getItem("socketIds");
        // Parse the stringify'd array
        if(socketIdsStr !== null && socketIdsStr.length) {
          var socketIds = JSON.parse(socketIdsStr);
        }
      }
      // If client doesn't support local storage or the socketIds array is empty for whatever reason, make one
      if(typeof socketIds === "undefined" || socketIds === null) {

        var socket = TWM.request("playlist:activeSocket");
        socketIds = new Array(socket.id);
      }
      return socketIds;
    },
    /**
     * Save open playlist to local
     * Add this playlist ID to a locally stored array of IDs. This way we know if a user opens the same playlist
     * in another tab/window and can stop it playing.
     */
    saveOpenPlaylistToLocal: function(playlistId) {

      var openPlaylists;
      if (Modernizr.localstorage) {

        var openPlaylistsStr = localStorage.getItem("openPlaylists");
        // Parse the stringify'd array
        if(openPlaylistsStr !== null && openPlaylistsStr.length) {
          var openPlaylists = JSON.parse(openPlaylistsStr);
        }
        // If the openPlaylists array has not yet been created, add it in there
        if(typeof openPlaylists === "undefined" || openPlaylists === null) {

          openPlaylists = new Array();
        }
        openPlaylists.push(playlistId)
        // Stringify the array again so we can save it in local storage
        openPlaylistsStr = JSON.stringify(openPlaylists);
        localStorage.setItem("openPlaylists", openPlaylistsStr);
        return openPlaylists;
      }
    },
    /**
     * Remove open playlist from local
     * Removes a playlist ID from the locally stored open playlist ID array
     * To be triggered on playlist close so we don't stop users legitimately listening to a playlist
     */
    removeOpenPlaylistFromLocal: function(playlistId) {

      var openPlaylists;
      if (Modernizr.localstorage) {

        var openPlaylistsStr = localStorage.getItem("openPlaylists");
        // Parse the stringify'd array
        if(openPlaylistsStr !== null && openPlaylistsStr.length) {
          var openPlaylists = JSON.parse(openPlaylistsStr);
        }
        // Check openPlaylists is an array and contains the ID we want to remove
        if(typeof openPlaylists === "undefined" || openPlaylists === null || openPlaylists.indexOf(playlistId) === -1) {

          return false;
        }
        else {

          // Find where playlistId is in the array and remove it
          var arrIndex = openPlaylists.indexOf(playlistId);
          openPlaylists.splice(arrIndex, 1);
        }

        // Stringify the array again so we can save it in local storage
        openPlaylistsStr = JSON.stringify(openPlaylists);
        localStorage.setItem("openPlaylists", openPlaylistsStr);
        return openPlaylists;
      }
    },
    /**
     * Get open playlists
     * Retrieve the array of open playlists from local storage
     */
    getOpenPlaylists: function() {

      var openPlaylists;
      if (Modernizr.localstorage) {
        var openPlaylistsStr = localStorage.getItem("openPlaylists");
        // Parse the stringify'd array
        if(openPlaylistsStr !== null && openPlaylistsStr.length) {
          var openPlaylists = JSON.parse(openPlaylistsStr);
        }
      }
      // Just return an empty array if openPlaylists was never set
      if(typeof openPlaylists === "undefined" || openPlaylists === null) {

        return new Array();
      }
      return openPlaylists;
    },
    /**
     * Playlist is open
     * Check the local storage to see if the user already has this playlist open in another window/tab
     * @return bool
     */
    playlistIsOpen: function(playlistId) {

      var openPlaylists = Playlist.Controller.getOpenPlaylists();
      return openPlaylists.indexOf(playlistId) > -1;
    },
    setActiveTrackClass: function() {

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
      var currentTrackIndex = playlistManager.getCurrentTrackIndex();
      $(".playback-track").removeClass("current");
      $(".playback-track").eq(currentTrackIndex).addClass("current");
    },
    updateTimer: function() {

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
      var currentTime = playlistManager.getCurrentTotalTime();
      // Cancel if the currentTime is 0 or not a number
      if(typeof currentTime !== "number" || currentTime == 0) {
        return false;
      }
      // Update the time in the header
      $(".current-time").text(TWM.Lib.secondsToMinutes(currentTime));
    },
    updateProgressBar: function(currentTime) {

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
      var trackIndex = playlistManager.currentTrackIndex;
      var $currentProgressBar = $('.current-progress').eq(trackIndex);
      var currentTrackData = playlistManager.getCurrentTrackData();
      if(currentTrackData !== null) {
        var currentTime = currentTrackData.pop.currentTime();
        var progress = currentTime / currentTrackData.duration * 100;
        $currentProgressBar.css({
          width: progress.toString() + "%"
        });
      }
    },
    /*
     * Wait for room
     * If there are too many people in the room, notify the user and listen for other users disconnecting
     * When someone disconnects we will check how many users are still on and attempt a reconnect if it is only 1
     */
    waitForRoom: function() {

      var socket = TWM.request("playlist:activeSocket");
      alert('Room is full, waiting for space');
      socket.on('userLeft', Playlist.API.joinRoom);

    },
    loadPlaylistFrom: function(data) {

      var socket = TWM.request("playlist:activeSocket");
      var playlist = TWM.request('playlist:activePlaylistMgr');
      var startTime = typeof data.startTime !== "undefined" ? data.startTime : 0;
      // work out if we are starting from the start (0) or resuming, and if resuming calculate where to resume from
      // based on what the server returned to us
      if(startTime !== 0) {

        startTime = Playlist.Controller.calculateTimeDiff(startTime);
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
        var timeDiff = Playlist.Controller.calculateTimeDiff(startTime);
        var updatedStartTime = playlist.getTrackFromTotalTime(timeDiff);
        playlist.playTrack(updatedStartTime.trackIndex, updatedStartTime.trackTime);
      }

      // Bind the Playlist UI
      Playlist.Controller.bindPlaylistUi();
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
});
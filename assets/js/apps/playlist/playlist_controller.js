TWM.module('Playlist', function(Playlist, TWM, Backbone, Marionette, $, _){

  Playlist.Controller = {
    /**
     * Join room
     * Emit the request event to join playlist room to the server via socket
     */
    joinRoom: function() {

      var socket = TWM.request('playlist:activeSocket');
      socket.emit('joinRoom', playlistId);
    },
    userJoinedRoom: function(numUsersInRoom) {

      if(numUsersInRoom === 1 && bootstrap.startTime.length === 0) {

        $('body').addClass('playlist-waiting');
      }
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
      for(var key in playlist.models){

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

      playlistManager = TWM.request('playlist:activePlaylistMgr');

      // Set the active track class ('current') when a track is playing or ends
      $(playlistManager).on('track:playing track:ended', this.setActiveTrackClass);
      // Display played and playing artwork
      $(playlistManager).on('track:playing', this.displayPlayedTrackArtwork);
      // Bind time updates to the time and progress bar
      $(playlistManager).on('track:timeupdate', this.updateTimer);
      $(playlistManager).on('track:timeupdate', this.updateProgressBar);
      // Ensure progress bar is 100% width when a track ends
      $(playlistManager).on('track:ended', this.fillProgressBar);
      // Listen to track ending and make sure the correct time is shown;
      $(playlistManager).on('playlist:ended', this.setTrackTimeOnEnd);
      $(playlistManager).on('playlist:ended', this.playlistFinished);
    },
    /**
     * Save Socket ID
     * Set the ID returned from the server on the socket model and persist it to the localStorage array of
     * socket IDs that this user has connected with (each new page load will generate +1)
     */
    saveSocketId: function(socketId) {

      var socket = TWM.request('playlist:activeSocket');
      var socketIds;
      socket.id = socketId;
      // Save it to local storage if client supports it
      if (Modernizr.localstorage) {
        var socketIdsStr = localStorage.getItem('socketIds');
        // Parse the stringify'd array
        if(socketIdsStr !== null && socketIdsStr.length) {
          socketIds = JSON.parse(socketIdsStr);
        }
        // If the socketIds array has not yet been created, add it in there
        if(typeof socketIds === 'undefined' || socketIds === null) {

          socketIds = [];
        }
        socketIds.push(socketId);
        // Stringify the array again so we can save it in local storage
        socketIdsStr = JSON.stringify(socketIds);
        localStorage.setItem('socketIds', socketIdsStr);
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
        var socketIdsStr = localStorage.getItem('socketIds');
        // Parse the stringify'd array
        if(socketIdsStr !== null && socketIdsStr.length) {
          socketIds = JSON.parse(socketIdsStr);
        }
      }
      // If client doesn't support local storage or the socketIds array is empty for whatever reason, make one
      if(typeof socketIds === 'undefined' || socketIds === null) {

        var socket = TWM.request('playlist:activeSocket');
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

        var openPlaylistsStr = localStorage.getItem('openPlaylists');
        // Parse the stringify'd array
        if(openPlaylistsStr !== null && openPlaylistsStr.length) {
          openPlaylists = JSON.parse(openPlaylistsStr);
        }
        // If the openPlaylists array has not yet been created, add it in there
        if(typeof openPlaylists === 'undefined' || openPlaylists === null) {

          openPlaylists = [];
        }
        openPlaylists.push(playlistId);
        // Stringify the array again so we can save it in local storage
        openPlaylistsStr = JSON.stringify(openPlaylists);
        localStorage.setItem('openPlaylists', openPlaylistsStr);
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

        var openPlaylistsStr = localStorage.getItem('openPlaylists');
        // Parse the stringify'd array
        if(openPlaylistsStr !== null && openPlaylistsStr.length) {
          openPlaylists = JSON.parse(openPlaylistsStr);
        }
        // Check openPlaylists is an array and contains the ID we want to remove
        if(typeof openPlaylists === 'undefined' || openPlaylists === null || openPlaylists.indexOf(playlistId) === -1) {

          return false;
        }
        else {

          // Find where playlistId is in the array and remove it
          var arrIndex = openPlaylists.indexOf(playlistId);
          openPlaylists.splice(arrIndex, 1);
        }

        // Stringify the array again so we can save it in local storage
        openPlaylistsStr = JSON.stringify(openPlaylists);
        localStorage.setItem('openPlaylists', openPlaylistsStr);
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
        var openPlaylistsStr = localStorage.getItem('openPlaylists');
        // Parse the stringify'd array
        if(openPlaylistsStr !== null && openPlaylistsStr.length) {
          openPlaylists = JSON.parse(openPlaylistsStr);
        }
      }
      // Just return an empty array if openPlaylists was never set
      if(typeof openPlaylists === 'undefined' || openPlaylists === null) {

        return [];
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

      // Remove current class from previous tracks
      $('.playback-track.current').removeClass('current');
      $('.playback-track').eq(currentTrackIndex).addClass('current');
    },
    displayPlayedTrackArtwork: function() {

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
      var currentTrackIndex = playlistManager.getCurrentTrackIndex();

      // Loop over played tracks and show the artwork
      for(var i = 0; i < currentTrackIndex; i++) {

        var $playbackTrack = $('.playback-track').eq(i);
        $playbackTrack.css({
          visibility: 'visible'
        });
      }

      Playlist.Controller.detectTitleWidth();
      Playlist.Controller.setLandscapeImage();
    },
    updateTimer: function() {

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
      var currentTime = playlistManager.getCurrentTotalTime();
      // Cancel if the currentTime is 0 or not a number
      if(typeof currentTime !== 'number' || currentTime === 0) {
        return false;
      }
      // Update the time in the header
      $('.current-time').text(TWM.Lib.secondsToMinutes(currentTime));
    },
    updateProgressBar: function(currentTime) {

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
      var trackIndex = playlistManager.currentTrackIndex;
      var $currentProgressBar = $('.current-progress').eq(trackIndex);
      var currentTrackData = playlistManager.getCurrentTrackData();
      if(currentTrackData !== null) {
        currentTime = currentTrackData.pop.currentTime();
        var progress = currentTime / currentTrackData.duration * 100;
        progress = progress.toFixed(3);
        $currentProgressBar.css({
          width: progress + '%'
        });
      }
    },
    /*
     * Fill progress bar
     * When a track ends ensure that its progress bar is full, update time isn't reliable for this
     */
    fillProgressBar: function(event) {

      var trackIndex = event.target.getCurrentTrackIndex();
      var $currentProgressBar = $('.current-progress').eq(trackIndex);
      $currentProgressBar.css({
        width: '100%'
      });
    },
    /*
     * Set track time on end
     * We can't rely on time updates to update the track timer in the header when a track finishes,
     * sometimes it may end on one second off which looks weird. So we'll run this instead so that when the playlist
     * finishes the current time equals the total time
     */
    setTrackTimeOnEnd: function() {

      $('.current-time').text($('.total-time').text());
    },
    /*
     * Fill complete progress bars
     * We call this when the playlist first starts playing to set any completed tracks' progress bars to 100%
     */
    fillCompletedProgressBars: function() {

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
      var trackIndex = playlistManager.currentTrackIndex;
      if(trackIndex > 0) {

        for(var i = 0; i < trackIndex; i++) {

          $('.current-progress').eq(i).css({
            width: '100%'
          });
        }
      }
    },
    /*
     * roomFull
     * If there are too many people in the room, notify the user and stop the module
     */
    roomFull: function() {

      var socket = TWM.request('playlist:activeSocket');
      $('body').addClass('playlist-full');
      Playlist.stop();
    },
    loadPlaylistFrom: function(data) {

      // Add the loading class to the body
      $('body').addClass('playlist-loading');
      var socket = TWM.request('playlist:activeSocket');
      var playlist = TWM.request('playlist:activePlaylistMgr');
      var startTime = typeof data.startTime !== 'undefined' ? data.startTime : 0;
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
        // Remove the loading and waiting class from the body
        $('body').removeClass('playlist-loading');
      });
    },
    playPlaylist: function(data) {

      // Add the playing class to the body and remove the waiting and loading classes
      $('body').addClass('playlist-playing').removeClass('playlist-waiting playlist-loading');
      $('.share-playlist-url').slideUp();

      var playlist = TWM.request('playlist:activePlaylistMgr');
      var startTime = data.startTime;
      // Account for any latency and get a fresh start time
      if(startTime === 0) {
        playlist.startPlaylist();
        TWM.trigger('playlist:playlistStart');
      }
      else {
        var timeDiff = Playlist.Controller.calculateTimeDiff(startTime);
        var updatedStartTime = playlist.getTrackFromTotalTime(timeDiff);
        playlist.playTrack(updatedStartTime.trackIndex, updatedStartTime.trackTime);
        // Fill out completed tracks' progress bars
        Playlist.Controller.fillCompletedProgressBars();
      }

      // Bind the Playlist UI
      Playlist.Controller.bindPlaylistUi();
      // Start the chat module
      Playlist.Chat.start();

    },
    calculateTimeDiff: function(startTime) {

      var currentUnixTime =  Math.round(new Date().getTime() / 1000);
      var timeDiff = currentUnixTime - startTime;
      return timeDiff;
    },
    playlistFinished: function() {

      TWM.trigger('playlist:playlistEnd');
    },
    muteToggle: function() {

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
      if(playlistManager.isMuted()) {

        playlistManager.unmuteAll();
      }
      else {

        playlistManager.muteAll();
      }
      return playlistManager.isMuted();
    },
    setLandscapeImage: function(){

      var $playlistArtwork = $('.playback-track-artwork img');

      $playlistArtwork.each(function(){
        if ($(this).width() > $(this).height()){
          $(this).addClass('landscape');
        }
      });
    },
    addTrackToPlaylist: function(trackData) {

      var playlistCollection = TWM.request('playlist:playlistCollection');
      playlistCollection.create(trackData);
    }
  };
});
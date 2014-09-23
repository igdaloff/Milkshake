TWM.module("Playlist", function(Playlist, TWM, Backbone, Marionette, $, _){
  
  Playlist.Controller = {
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
    setActiveTrackClass: function() {

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
      var currentTrackIndex = playlistManager.getCurrentTrackIndex();
      $(".playlist-track").removeClass("current");
      $(".playlist-track").eq(currentTrackIndex).addClass("current");
    },
    updateTimer: function(e, currentTime) {

      // Cancel if the currentTime is 0 or not a number
      if(typeof currentTime !== "number" || currentTime == 0) {
        return false;
      }
      // Update the time in the header
      $(".current-time").text(TWM.Lib.secondsToMinutes(currentTime));
    },
    updateProgressBar: function(currentTime) {

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
        
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
        }
        // Everything else should be 0
        else {

          $progressBar.width(0);
        }
      });
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
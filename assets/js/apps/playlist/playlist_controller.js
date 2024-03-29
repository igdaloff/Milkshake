TWM.module('Playlist', function(Playlist, TWM, Backbone, Marionette, $, _){

  Playlist.Controller = {
    /**
     * Join room
     * Emit the request event to join playlist room to the server via socket
     */
    joinRoom: function() {

      var socket = TWM.request('playlist:activeSocket');
      var playlistModel = TWM.request('playlist:activePlaylistModel');
      socket.emit('joinRoom', playlistModel.id);
    },
    updateNumUsersInRoom: function(numUsersInRoom) {

      var playlistModel = TWM.request('playlist:activePlaylistModel');
      playlistModel.set('usersConnected', numUsersInRoom);
      if(numUsersInRoom === 1 && typeof(playlistModel.get('startTime')) === 'undefined') {

        $('body').addClass('playlist-waiting');
        $('.playlist-share-url').select();
      }
    },
    userJoinedRoom: function(numUsersInRoom) {

      var playlistModel = TWM.request('playlist:activePlaylistModel');
      playlistModel.set('usersConnected', numUsersInRoom);
      if(numUsersInRoom > 1) {

        $('body').removeClass('playlist-waiting');
      }
    },
    remoteUserDisconnected: function(numUsersInRoom) {

      var playlistModel = TWM.request('playlist:activePlaylistModel');
      playlistModel.set('usersConnected', numUsersInRoom);
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

      // Set the isPlaying attribute on a track model when it is playing
      $(playlistManager).on('track:playing track:ended', this.setPlayingTrackAttribute);
      // Set up marquee on new track titles
      $(playlistManager).on('track:playing track:ended', this.detectTitleWidth);
      // Bind time updates to the time and progress bar
      $(playlistManager).on('track:timeupdate', this.updateCurrentTime);
      // Ensure progress bar is 100% width when a track ends
      $(playlistManager).on('track:ended', this.fillProgressBar);
      // Listen to playlist ending and run necessary tasks
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
     * Save playlist to local
     * Add a playlist model to a locally stored array of playlist objects.
     */
    setPlayingTrackAttribute: function() {

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
      var playlistModel = TWM.request('playlist:activePlaylistModel');
      var currTrackIndex = playlistManager.getCurrentTrackIndex();
      // Set isPlaying on the currently playing track
      playlistModel.tracks.at(currTrackIndex).set('isPlaying', true);
    },
    updateCurrentTime: function() {

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
      var currentTotalTime = playlistManager.getCurrentTotalTime();
      // Cancel if the currentTime is 0 or not a number
      if(playlistManager.finished || typeof currentTotalTime !== 'number' || currentTotalTime === 0) {

        return false;
      }
      // Update the current time on the playlist model
      var playlistModel = TWM.request('playlist:activePlaylistModel');
      playlistModel.set('currentTime', currentTotalTime);
      // And on the current track model
      var currentTrackIndex = playlistManager.getCurrentTrackIndex();
      var currentTrackTime = playlistManager.getCurrentTrackData().pop.currentTime();
      playlistModel.tracks.at(currentTrackIndex).set('currentTime', currentTrackTime);
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
      // work out if we are starting from the start (now) or resuming, and if resuming calculate where to resume from
      // based on what the server returned to us
      if(startTime !== 0) {

        startTime = Playlist.Controller.calculateTimeDiff(startTime);
      }
      // If there are tracks to play, wait until the first track has loaded
      if(playlist.tracks.length) {

        playlist.loadFromTotalTime(startTime, onReadyCb);

      }
      // Otherwise the playlist is ready now
      else {

        onReadyCb();
      }

      function onReadyCb() {

        // Tell the server we are ready to start
        socket.emit('userReadyToPlay');
        // Remove the loading and waiting class from the body
        $('body').removeClass('playlist-loading');
      }
    },
    playPlaylist: function(data) {

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
      // Do not execute if there are no tracks to play

      // Bind the Playlist UI
      Playlist.Controller.bindPlaylistUi();

      if(playlistManager.tracks.length) {

        // Add the playing class to the body and remove the waiting and loading classes
        $('body').addClass('playlist-playing').removeClass('playlist-waiting playlist-loading');

        var startTime = data.startTime;
        var timeDiff = Playlist.Controller.calculateTimeDiff(startTime);

        // Account for any latency and get a fresh start time
        if(startTime === 0) {
          playlistManager.startPlaylist();
          // GA event
          TWM.trigger('playlist:start');
        }
        // If there's time left in the current playlist, get going
        else if(timeDiff < playlistManager.getPlaylistDuration()) {

          var updatedStartTime = playlistManager.getTrackFromTotalTime(timeDiff);
          playlistManager.playTrack(updatedStartTime.trackIndex, updatedStartTime.trackTime);
          TWM.trigger('playlist:resume');
        }
        // Otherwise the playlist is over, mark the finished bool on the playlist manager
        else {

          // Manualy tell the playlist manager it has finished
          playlistManager.setFinished();
          // Run necessary tasks on finish
          Playlist.Controller.playlistFinished();
        }
      }
    },
    calculateTimeDiff: function(startTime) {

      var currentUnixTime = new Date().getTime();
      var timeDiff = currentUnixTime - startTime;
      var timeDiffSecs = Math.round(timeDiff / 1000);
      return timeDiffSecs;
    },
    playlistFinished: function() {

      $('body').removeClass('playlist-playing');
      var playlistModel = TWM.request('playlist:activePlaylistModel');
      // Set all models to played
      playlistModel.tracks.setAll('hasPlayed', true);
      playlistModel.tracks.setAll('isPlaying', false);
      // Update the current time to match the total time
      $('.current-time').text($('.total-time').text());
      TWM.trigger('playlist:playlistEnd');
      // Set up a listener to re-add the playing class when a track starts playing again
      playlistModel.listenTo(playlistModel.tracks, 'change:isPlaying', function(model) {

        if(model.get('isPlaying')) {
          $('body').addClass('playlist-playing');
        }
      });
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
    sendTrackToPlaylist: function(trackData) {

      // Request the socket object
      var socket = TWM.request('playlist:activeSocket');
      // Remove the _id and id attribute if they exist
      delete trackData._id;
      delete trackData.id;
      socket.emit('addTrack', trackData);
      // GA event
      TWM.trigger('playlist:addTrack');
    },
    addTrackToPlaylist: function(newTrackData) {

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
      var playlistModel = TWM.request('playlist:activePlaylistModel');
      var newModel = playlistModel.tracks.add(newTrackData);
      newTrackData.id = newModel.id;
      // Add the new track to the playlist manager
      playlistManager.addTrackToPlaylist(newTrackData);
      // If the playlist has finished, or if two users are connected and the currentTime is at 0, start playing the new track now
      if(playlistManager.finished || (playlistModel.get('usersConnected') === 2 && playlistModel.get('currentTime') === 0)) {

        playlistManager.playTrack(playlistManager.tracks.length - 1, 0, true);
      }
      // If this is the first track being added by the first user (pre-start) embed it
      else if(playlistModel.tracks.length === 1) {

        playlistManager.initTrackEmbed(0);
      }
    },
    sendTrackDelete: function(trackModel) {

      var socket = TWM.request('playlist:activeSocket');
      socket.emit('removeTrack', trackModel.id);
      // GA event
      TWM.trigger('playlist:deleteTrack');
    },
    sendTrackSkip: function(trackModel) {

      var socket = TWM.request('playlist:activeSocket');
      socket.emit('skipTrack', trackModel.id);

      // Force this track to be hasPlayed and notPlaying, so it greys out immediately
      trackModel.set({
        hasPlayed: true,
        isPlaying: false
      });

      // GA event
      TWM.trigger('playlist:skipTrack');
    },
    deleteTrack: function(trackData) {

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
      var playlistModel = TWM.request('playlist:activePlaylistModel');
      // Get the rank of the track to be deleted from the collection
      var oldRank = playlistModel.tracks.get(trackData._id).get('rank');
      // Remove the track from the collection
      playlistModel.tracks.remove(playlistModel.tracks.get(trackData._id));
      // Remove the track from the playlist manafer
      playlistManager.destroy(trackData._id);
      // Decrement the ranks of all models above this one where the rank was the same or higher
      for(var i = 0; i < playlistModel.tracks.models.length; i++) {

        var trackModel = playlistModel.tracks.at(i);
        if(trackModel.get('rank') >= oldRank) {

          var newRank = trackModel.get('rank') - 1;
          // Update the model's rank
          trackModel.set('rank', newRank);
          // Update the rank of the playlist manager track
          playlistManager.setRank(trackModel.id, newRank);
        }
      }
      // Sort the collection and playlist manager
      playlistModel.tracks.sort();
      playlistManager.reSort();
    },
    sendNewTrackOrder: function(trackId, newRank) {

      var socket = TWM.request('playlist:activeSocket');
      socket.emit('reorderTracks', {
        trackId: trackId,
        newRank: newRank
      });
      // GA event
      TWM.trigger('playlist:reorderTrack');
    },
    reorderTracks: function(updatedTracks) {

      var playlistModel = TWM.request('playlist:activePlaylistModel');
      var playlistManager = TWM.request('playlist:activePlaylistMgr');

      // Loop over the models in the track collection and update the ranks in the playlist collection and playlist manager
      for(var i = 0; i < updatedTracks.length; i++) {

        var updatedTrackData = updatedTracks[i];
        playlistModel.tracks.get(updatedTrackData._id).set('rank', updatedTrackData.rank);
        playlistManager.setRank(updatedTrackData._id, updatedTrackData.rank);
      }
      // Sort the collection and playlist manager
      playlistModel.tracks.sort();
      playlistManager.reSort();
    },
    sendNewPlaylistName: function(newTitle) {

      var socket = TWM.request('playlist:activeSocket');
      socket.emit('changeTitle', newTitle);
    },
    renamePlaylist: function(newTitle) {

      var playlistModel = TWM.request('playlist:activePlaylistModel');
      document.title = newTitle + ' - Milkshake';
      playlistModel.set('title', newTitle);
    },
    reAddTrack: function(modelAttributes) {

      // Reset the track's duration in case it was skipped and the duration was truncated
      modelAttributes.duration = modelAttributes.originalDuration;
      TWM.Playlist.Controller.sendTrackToPlaylist(modelAttributes);
      // GA event
      TWM.trigger('playlist:readdTrack');
    },
    skipTrack: function(skippedTrackData) {

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
      var playlistModel = TWM.request('playlist:activePlaylistModel');

      // Ensure that the skipped track and the currently playing track have the same ID, ie. it has not already finished/been skipped
      var currentTrackIndex = playlistManager.getCurrentTrackIndex();
      var currentTrackModel = playlistModel.tracks.at(currentTrackIndex);
      if(skippedTrackData === null || currentTrackModel.id === skippedTrackData._id) {

        // Skip to the next track in the playlist. If there isn't one, the playlist will stop
        playlistManager.next();
      }
    }
  };
});
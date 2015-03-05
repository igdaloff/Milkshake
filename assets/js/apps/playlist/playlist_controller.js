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

      // Set the isPlaying attribute on a track model when it is playing
      $(playlistManager).on('track:playing track:ended', this.setPlayingTrackAttribute);
      // Set up marquee on new track titles
      $(playlistManager).on('track:playing track:ended', this.detectTitleWidth);
      // Bind time updates to the time and progress bar
      $(playlistManager).on('track:timeupdate', this.updateTimer);
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
    setPlayingTrackAttribute: function() {

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
      var playlistCollection = TWM.request('playlist:playlistCollection');
      var currTrackIndex = playlistManager.getCurrentTrackIndex();
      // Set isPlaying on the currently playing track
      playlistCollection.at(currTrackIndex).set('isPlaying', true);
    },
    updateTimer: function() {

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
      var currentTime = playlistManager.getCurrentTotalTime();
      // Cancel if the currentTime is 0 or not a number
      if(playlistManager.finished || typeof currentTime !== 'number' || currentTime === 0) {
        return false;
      }
      // Update the time in the header
      $('.current-time').text(TWM.Lib.secondsToMinutes(currentTime));
    },
    updateTimerTotal: function() {

      var playlistCollection = TWM.request('playlist:playlistCollection');
      $('.total-time').text(TWM.Lib.secondsToMinutes(playlistCollection.getTotalDuration()));
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

      // Bind the Playlist UI
      Playlist.Controller.bindPlaylistUi();
      // Start the chat module
      Playlist.Chat.start();

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
      var startTime = data.startTime;
      var timeDiff = Playlist.Controller.calculateTimeDiff(startTime);

      // Account for any latency and get a fresh start time
      if(startTime === 0) {
        playlistManager.startPlaylist();
        TWM.trigger('playlist:playlistStart');
      }
      // If there's time left in the current playlist, get going
      else if(timeDiff < playlistManager.getPlaylistDuration()) {

        var updatedStartTime = playlistManager.getTrackFromTotalTime(timeDiff);
        playlistManager.playTrack(updatedStartTime.trackIndex, updatedStartTime.trackTime);
      }
      // Otherwise the playlist is over, mark the finished bool on the playlist manager
      else {

        // Manualy tell the playlist manager it has finished
        playlistManager.setFinished();
        // Run necessary tasks on finish
        Playlist.Controller.playlistFinished();
      }
    },
    calculateTimeDiff: function(startTime) {

      var currentUnixTime = new Date().getTime();
      var timeDiff = currentUnixTime - startTime;
      var timeDiffSecs = Math.round(timeDiff / 1000);
      return timeDiffSecs;
    },
    playlistFinished: function() {

      var playlistCollection = TWM.request('playlist:playlistCollection');
      // Set all models to played
      playlistCollection.setAll('hasPlayed', true);
      playlistCollection.setAll('isPlaying', false);
      // Update the current time to match the total time
      $('.current-time').text($('.total-time').text());
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
    sendTrackToPlaylist: function(trackData) {

      // Request the socket object
      var socket = TWM.request('playlist:activeSocket');
      // Remove the _id and id attribute if they exist
      delete trackData._id;
      delete trackData.id;
      socket.emit('addTrack', trackData);
    },
    addTrackToPlaylist: function(newTrackData) {

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
      var playlistCollection = TWM.request('playlist:playlistCollection');
      var newModel = playlistCollection.add(newTrackData);
      newTrackData.id = newModel.id;
      // Add the new track to the playlist manager
      playlistManager.addTrackToPlaylist(newTrackData);
    },
    sendTrackDelete: function(trackId) {

      var socket = TWM.request('playlist:activeSocket');
      socket.emit('removeTrack', trackId);
    },
    deleteTrack: function(trackData) {

      var playlistManager = TWM.request('playlist:activePlaylistMgr');
      var playlistCollection = TWM.request('playlist:playlistCollection');
      // Get the rank of the track to be deleted from the collection
      var oldRank = playlistCollection.get(trackData._id).get('rank');
      // Remove the track from the collection
      playlistCollection.remove(playlistCollection.get(trackData._id));
      // Remove the track from the playlist manafer
      playlistManager.destroy(trackData._id);
      // Decrement the ranks of all models above this one where the rank was the same or higher
      for(var i = 0; i < playlistCollection.models.length; i++) {

        var trackModel = playlistCollection.at(i);
        if(trackModel.get('rank') >= oldRank) {

          var newRank = trackModel.get('rank') - 1;
          // Update the model's rank
          trackModel.set('rank', newRank);
          // Update the rank of the playlist manager track
          playlistManager.setRank(trackModel.id, newRank);
        }
      }
      // Sort the collection and playlist manager
      playlistCollection.sort();
      playlistManager.reSort();
    },
    sendNewTrackOrder: function(trackId, newRank) {

      var socket = TWM.request('playlist:activeSocket');
      socket.emit('reorderTracks', {
        trackId: trackId,
        newRank: newRank
      });
    },
    reorderTracks: function(updatedTracks) {

      var playlistCollection = TWM.request('playlist:playlistCollection');
      var playlistManager = TWM.request('playlist:activePlaylistMgr');

      // Loop over the models in the track collection and update the ranks in the playlist collection and playlist manager
      for(var i = 0; i < updatedTracks.length; i++) {

        var updatedTrackData = updatedTracks[i];
        playlistCollection.get(updatedTrackData._id).set('rank', updatedTrackData.rank);
        playlistManager.setRank(updatedTrackData._id, updatedTrackData.rank);
      }
      // Sort the collection and playlist manager
      playlistCollection.sort();
      playlistManager.reSort();
    },
    renamePlaylist: function(newTitle) {

      // Todo - set up a playlist model that we can change this title on!
    }
  };
});
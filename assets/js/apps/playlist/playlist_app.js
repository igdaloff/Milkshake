TWM.module('Playlist', function(Playlist, TWM, Backbone, Marionette, $, _){

  // prevent starting with parent
  this.startWithParent = false;

  Playlist.API = {
    /*
     * On User Connect
     * Handle the sending and receiving of socket messages
     */
    onUserConnect: function(socket) {

      // Pick up the socket ID when the server sends it to us
      socket.on('newConnectionId', Playlist.Controller.saveSocketId);
      // If the room is full, perform an action to notify the user
      socket.on('roomFull', Playlist.Controller.roomFull);
      // When the server tells us when to start loading the playlist from
      socket.on('loadPlaylistFrom', Playlist.Controller.loadPlaylistFrom);
      // When the server sends the play event
      socket.on('playPlaylist', Playlist.Controller.playPlaylist);
      // When a user (including this client) joins a room
      socket.on('userJoined', Playlist.Controller.userJoinedRoom);
      // A new track is added to the playlist
      socket.on('newTrack', Playlist.Controller.addTrackToPlaylist);
      // Delete a track from the playlist
      socket.on('deleteTrack', Playlist.Controller.deleteTrack);
      // A reordered set of tracks is sent from the server
      socket.on('reorderedTracks', Playlist.Controller.reorderTracks);
      // Set a request handler so we can get the active socket in future
      TWM.reqres.setHandler("playlist:activeSocket", function() {

        return socket;
      });

      // Request to join the room
      Playlist.Controller.joinRoom();
    }
  };

  Playlist.on('before:start', function() {

    // Don't do anything if this playlist is already open in another tab/window, ie stop the module
    // Check every n seconds in case the window is closed and we should try again
    if(Playlist.Controller.playlistIsOpen(playlistId)) {

      console.log('playlist open in another tab/window, waiting for it to close');
      Playlist.stop();
      var closedPlaylistPoller = window.setInterval(function() {

        console.log('still waiting...');
        if(!Playlist.Controller.playlistIsOpen(playlistId)) {

          Playlist.start();
          window.clearInterval(closedPlaylistPoller);
        }
      }, 1000);
    }
    else {

      // Add this playlist Id to the locally stored open playlists array
      Playlist.Controller.saveOpenPlaylistToLocal(playlistId);

      // If the user leaves this page, remove the playlist ID from the openplaylists local array
      window.addEventListener("beforeunload", function(e){

        Playlist.Controller.removeOpenPlaylistFromLocal(playlistId);
      }, false);
    }
  });

  Playlist.on('start', function(){

    var tracks = bootstrap.tracks || [];
    var playlist = TWM.request('newPlaylist:entities', tracks);

    // Set a handler to get the playlist collection entity
    TWM.reqres.setHandler('playlist:playlistCollection', function() {

      return playlist;
    });

    // create a new playlist manager from the API.loadPlayer method
    var playlistManager = Playlist.Controller.loadPlayer(playlist);

    // Set a handler to get the playlist manager easily
    TWM.reqres.setHandler('playlist:activePlaylistMgr', function() {

      return playlistManager;
    });

    // Set a handler to return the array of socket IDs in the user's connection history
    TWM.reqres.setHandler('playlist:socketIdHistory', function() {

      return Playlist.Controller.getSocketHistory();
    });

    // Initialize the track list views
    var playedTrackListView = new Playlist.PlayedTrackList({
      el: '.playback-track-list.played-tracks',
      collection: playlist
    }).render();

    var futureTrackListView = new Playlist.FutureTrackList({
      el: '.playback-track-list.future-tracks',
      collection: playlist
    }).render();

    // Update the playlist total time when a track is added
    playlist.on('add remove', Playlist.Controller.updateTimerTotal);

    // Initialize the controls view
    var controlsView = new Playlist.Controls();
  });
});
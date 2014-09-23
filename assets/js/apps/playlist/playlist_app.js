TWM.module('Playlist', function(Playlist, TWM, Backbone, Marionette, $, _){

  // prevent starting with parent
  this.startWithParent = false;

  Playlist.API = {
    joinRoom: function() {
      
      var socket = TWM.request("playlist:activeSocket");
      socket.emit('joinRoom', playlist_id);
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
      socket.on('roomFull', Playlist.Controller.waitForRoom);
      // When the server tells us when to start loading the playlist from
      socket.on('loadPlaylistFrom', Playlist.Controller.loadPlaylistFrom);
      // When the server sends the play event
      socket.on('playPlaylist', Playlist.Controller.playPlaylist);
      // When the other user disconnects
      socket.on('userLeft', Playlist.Controller.onUserLeft);

      // Set a request handler so we can get the active socket in future
      TWM.reqres.setHandler("playlist:activeSocket", function() {

        return socket;
      });
    }
  }

  Playlist.on('start', function(){

    var tracks = bootstrap || {};
    var playlist = TWM.request('newPlaylist:entities', tracks);

    // create a new playlist manager from the API.loadPlayer method
    var playlistManager = Playlist.Controller.loadPlayer(playlist);

    // Set a handler to get the playlist manager easily
    TWM.reqres.setHandler('playlist:activePlaylistMgr', function() {

      return playlistManager;
    });

    // bind the UI
    Playlist.Controller.bindPlaylistUi();
  });
});
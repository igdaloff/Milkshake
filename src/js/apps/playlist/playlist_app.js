TWM.module("Playlist", function(Playlist, TWM, Backbone, Marionette, $, _){

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

    $(".playlist-toggle-play").on("click", function(){

      playlistManager.togglePlayPause();
      console.log("Now playing " + playlistManager.getCurrentTrackData().title);
    });

    $(".playlist-next").on("click", function(){

      playlistManager.next();
      console.log("Now playing " + playlistManager.getCurrentTrackData().title);
    });
    $(".playlist-prev").on("click", function(){

      playlistManager.previous();
      console.log("Now playing " + playlistManager.getCurrentTrackData().title);
    });

    // Bind time updates to the progress bars
    $(playlistManager).on("timeupdate:track", function(event, currentTime){

      var trackIndex = playlistManager.getCurrentTrackIndex();
      var trackData = playlistManager.getTrackData(trackIndex);
      $(".playlist-track").each(function(i) {

        var $progressBar = $(this).find(".current-progress");
        // Set the previous tracks duration to 100%
        if(i < trackIndex) {
          $progressBar.width("100%");
        }
        // Update the current track's progress
        else if(i == trackIndex) {

          var trackProgress = currentTime / trackData.duration * 100;
          $progressBar.width(trackProgress + "%");

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
      var playlistManager = TWM.request("playlistManager:components", {
        tracks: tracks
      });
      return playlistManager;
    },
    onUserConnect: function(userCount, socket) {

      var playlist = TWM.request("playlist:activePlaylistMgr");
      // Wait until both users have the tracks loaded and ready to play
      playlist.onTrackReady(0, function(track) {

        // When the server tells us both users are ready, start the playlist in 3 seconds
        socket.on("bothUsersReady", function() {

          console.log("Playing in 3 seconds...");
          var delay = window.setTimeout(function() {

            track.play();
          }, 3000);
        });
        // Tell the server we are ready
        socket.emit("userReady", socket.id);
      });
    }
  }

  Playlist.on("start", function(){

    var tracks = bootstrap || {};
    var playlist = TWM.request("newPlaylist:entities", tracks);
    // create a new playlist manager from the API.loadPlayer method
    var playlistManager = Playlist.API.loadPlayer(playlist);
    // bind controls to the new playlist manager object
    bindPlaylistUi(playlistManager);
    TWM.reqres.setHandler("playlist:activePlaylistMgr", function() {

      return playlistManager;
    });
  });
});
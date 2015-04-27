TWM.module('Homepage', function(Homepage, TWM, Backbone, Marionette, $, _){

  this.startWithParent = false;

  var getLocalPlaylistData = function() {

    var recentPlaylists = [];
    if (Modernizr.localstorage) {

      var recentPlaylistsStr = localStorage.getItem('recentPlaylists');
      // Parse the stringify'd array
      if(recentPlaylistsStr !== null && recentPlaylistsStr.length) {
        recentPlaylists = JSON.parse(recentPlaylistsStr);
      }
    }
    return recentPlaylists;
  };

  Homepage.on('start', function() {

    var recentPlaylists = getLocalPlaylistData();
    var playlistCollection = new Backbone.Collection(recentPlaylists);

    playlistCollection.comparator = function(model) {

      return -model.get('updated');
    };

    playlistCollection.sort();

    // If there are recent playlists, set up a view to display them
    if(playlistCollection.length) {

      var recentPlaylistsRegion = new Marionette.Region({
        el: '.previous-playlists-container'
      });

      var recentPlaylistsView = new Homepage.RecentPlaylists({
        collection: playlistCollection
      });

      recentPlaylistsRegion.show(recentPlaylistsView);

      // GA tracking event
      $('.create-playlist-btn').on('click', function() {

        TWM.trigger('homepage:playlistCreate');
      });
    }
  });
});
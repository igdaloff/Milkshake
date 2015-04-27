TWM.module('Tracking', function(Tracking, TWM, Backbone, Marionette, $, _){

  Tracking.on('start', function() {

    // Create playlist
    TWM.on('homepage:playlistCreate', function() {

      ga('send', 'event', 'create', 'Create playlist');
    });

    // New search
    TWM.on('trackSearch:newSearch', function(query) {

      ga('send', 'event', 'playback', 'Search');
    });

    // Add track
    TWM.on('playlist:addTrack', function(trackData) {

      ga('send', 'event', 'playback', 'Add track to playlist');
    });

    // Playlist started
    TWM.on('playlist:playlistStart', function() {

      ga('send', 'event', 'playback', 'Start playlist');
    });

    // Delete track
    TWM.on('playlist:deleteTrack', function() {

      ga('send', 'event', 'playback', 'Delete track');
    });

    // Reorder track
    TWM.on('playlist:reorderTrack', function() {

      ga('send', 'event', 'playback', 'Reorder track');
    });

    // Re-add a track
    TWM.on('playlist:readdTrack', function() {

      ga('send', 'event', 'playback', 'Readd track');
    });

    // Click a previous playlist link
    TWM.on('playlist:clickPreviousPlaylistLink', function() {

      ga('send', 'event', 'create', 'Click previous playlist');
    });
  });
});
TWM.module('Tracking', function(Tracking, TWM, Backbone, Marionette, $, _){

  Tracking.on('start', function() {

    // New search
    TWM.on('trackSearch:newSearch', function(query) {

      ga('send', 'event', 'create', 'Search');
    });

    // Preview track
    TWM.on('trackSearch:previewTrack', function(trackData) {

      ga('send', 'event', 'create', 'Preview track');
    });

    // Add track
    TWM.on('trackSearch:addTrack', function(trackData) {

      ga('send', 'event', 'create', 'Add track to playlist');
    });

    // Create playlist
    TWM.on('create:playlistCreate', function() {

      ga('send', 'event', 'create', 'Create playlist');
    });

    // Playlist started
    TWM.on('playlist:playlistStart', function() {

      ga('send', 'event', 'playback', 'Start playlist');
    });

    // Playlist ended
    TWM.on('playlist:playlistEnd', function() {

      ga('send', 'event', 'playback', 'End playlist');
    });

    // Make new playlist CTA
    TWM.on('playlist:createAnotherPlaylist', function() {

      ga('send', 'event', 'playback', 'Create after playlist');
    });

  });
});
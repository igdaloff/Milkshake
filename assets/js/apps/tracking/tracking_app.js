TWM.module('Tracking', function(Tracking, TWM, Backbone, Marionette, $, _){

  Tracking.on('start', function() {

    // New search
    TWM.on('trackSearch:newSearch', function(query) {

      ga('send', 'event', 'create', 'click', 'search-tracks');
    });

    // Preview track
    TWM.on('trackSearch:previewTrack', function(trackData) {

      ga('send', 'event', 'create', 'click', 'preview-track');
    });

    // Add track
    TWM.on('trackSearch:addTrack', function(trackData) {

      ga('send', 'event', 'create', 'click', 'add-track');
    });

    // Create playlist
    TWM.on('create:playlistCreate', function() {

      ga('send', 'event', 'create', 'submit', 'create-playlist');
    });
  });
});
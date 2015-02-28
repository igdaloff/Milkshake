TWM.module('Playlist', function(Playlist, TWM, Backbone, Marionette, $, _){

  Playlist.Track = Marionette.ItemView.extend({
    template: 'playlist-track',
    tagName: 'tr',
    className: 'playback-track basic-table-row'
  });

  Playlist.TrackList = Marionette.CollectionView.extend({
    tagName: 'table',
    className: 'playback-track-list',
    childView: Playlist.Track
  });

  Playlist.Controls = Marionette.ItemView.extend({
    el: '.playback-page',
    events: {
      'click .mute-toggle': 'muteToggle'
    },
    muteToggle: function(e) {

      var muted = Playlist.Controller.muteToggle();
      var $muteToggle = $('.mute-toggle');

      if(muted) {

        $muteToggle.addClass('muted');
      }
      else {

        $muteToggle.removeClass('muted');
      }
    }
  });
});
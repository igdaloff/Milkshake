TWM.module('Playlist', function(Playlist, TWM, Backbone, Marionette, $, _){

  Playlist.Track = Marionette.ItemView.extend({
    template: 'playlist-track',
    tagName: 'li',
    className: 'playback-track',
    modelEvents: {
      'change:isPlaying': 'toggleIsPlayingClass',
      'change:hasPlayed': 'togglehasPlayedClass'
    },
    toggleIsPlayingClass: function() {

      var className = 'current';
      if(this.model.get('isPlaying')) {

        this.$el.addClass(className);
      }
      else {

        this.$el.removeClass(className);
      }
    },
    togglehasPlayedClass: function() {

      var className = 'played';
      if(this.model.get('hasPlayed')) {

        this.$el.addClass(className);
      }
      else {

        this.$el.removeClass(className);
      }
    }
  });

  Playlist.TrackList = Marionette.CollectionView.extend({
    tagName: 'ul',
    className: 'playback-track-list',
    childView: Playlist.Track
  });

  Playlist.Controls = Marionette.ItemView.extend({
    el: '.playback-page',
    events: {
      'click .mute-toggle': 'muteToggle',
      'click .close-banner-message': 'removeFinishedBanner'
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
    },
    removeFinishedBanner: function(e){
      e.preventDefault();
      $('.playlist-finished-message').removeClass('active');
    }
  });
});
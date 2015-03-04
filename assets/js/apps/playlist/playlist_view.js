TWM.module('Playlist', function(Playlist, TWM, Backbone, Marionette, $, _){

  Playlist.Track = Marionette.ItemView.extend({
    template: 'playlist-track',
    tagName: 'tr',
    className: 'playback-track basic-table-row',
    events: {
      'click .delete-track': 'deleteTrack',
      'click .readd-track ': 'reAddTrack'
    },
    modelEvents: {
      'change:isPlaying': 'toggleIsPlayingClass',
      'change:hasPlayed': 'togglehasPlayedClass'
    },
    onRender: function() {

      this.el.setAttribute('data-id', this.model.id);
      this.toggleIsPlayingClass();
      this.togglehasPlayedClass();
    },
    onShow: function() {

      this.setLandscapeImage();
    },
    setLandscapeImage: function(){

      var $trackArtwork = this.$('img');
      if ($trackArtwork.width() > $trackArtwork.height()){
        $trackArtwork.addClass('landscape');
      }
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
    },
    deleteTrack: function() {

      Playlist.Controller.sendTrackDelete(this.model.id);
    },
    reAddTrack: function(e){

      e.preventDefault();
      TWM.Playlist.Controller.sendTrackToPlaylist(this.model.attributes);
    }
  });

  Playlist.TrackList = Marionette.CollectionView.extend({
    tagName: 'table',
    className: 'playback-track-list',
    childView: Playlist.Track,
    onRender: function() {

      // Allow tracks to be dragged and sorted
      $('.playback-track-list tbody').sortable({
        cancel: '.played, .current',
        placeholder: 'track-reorder-gap'
      }).disableSelection();
    }
  });

  Playlist.PlayedTrackList = Playlist.TrackList.extend({
    className: 'playback-track-list played-tracks'
  });

  Playlist.FutureTrackList = Playlist.TrackList.extend({
    className: 'playback-track-list future-tracks',
    initialize: function() {
        
      // On first load, scroll to current track
      this.listenToOnce(this.collection, 'change:isPlaying', this.scrollToCurrentTrack);
    },
    onRender: function() {

      // Allow tracks to be dragged and sorted
      this.$('tbody').sortable({
        cancel: '.played, .current',
        update: function(e, ui) {

          var trackModelId = ui.item.data('id');
          var newRank = ui.item.index();
          Playlist.Controller.sendNewTrackOrder(trackModelId, newRank);
        }
      });
    },
    scrollToCurrentTrack: function(model) {

      // Scroll playlist container to current track
      var currentTrackPos = this.$('.current').position();
      var currentTrackHeight = this.$('.current').height();
      var playlistPos = this.$el.position();
      $('.playback-tracks').scrollTop(currentTrackPos.top + playlistPos.top - currentTrackHeight);
    }
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
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

      var _this = this;
      // Allow tracks to be dragged and sorted
      this.$('tbody').sortable({
        cancel: '.played, .current',
        update: function(e, ui) {

          var trackModelId = ui.item.data('id');
          var newRank = ui.item.index();
          Playlist.Controller.sendNewTrackOrder(trackModelId, newRank);
        }
      });

      // For following tracks, only jump to current track if the user isn't moused over the playlist-tracks element
      this.$el.parent().on('mouseleave', function(e) {

        _this.listenTo(_this.collection, 'change:isPlaying', _this.scrollToCurrentTrack);
        $(this).off('mouseenter.cancelScrollJump');
        $(this).on('mouseenter.cancelScrollJump', function() {

          _this.stopListening(_this.collection, 'change:isPlaying');
        });
      });
    },
    scrollToCurrentTrack: function(model) {

      // Only do something if a new track is playing, not if the last one just ended
      if(model.get('isPlaying')) {
        // Scroll playlist container to current track
        var currentTrackPos = this.$('.current').position();
        var currentTrackHeight = this.$('.current').height();
        var playlistPos = this.$el.position();
        $('.playback-tracks').scrollTop(currentTrackPos.top + playlistPos.top - currentTrackHeight);
      }
    }
  });

  Playlist.Controls = Marionette.ItemView.extend({
    el: '.playback-page',
    events: {
      'click .mute-toggle': 'muteToggle',
      'click .playlist-title': 'titleEdit',
      'keydown': 'escEditPlaylistTitle',
      'click .end-of-tracks': 'focusTrackSearch'
    },
    ui: {
      playlistHeader: '.playback-header',
      playlistTitleInput: '.playlist-title-input'
    },
    modelEvents: {
      'change:title': 'updateTitle'
    },
    initialize: function() {

      this.bindUIElements();
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
    titleEdit: function() {

      var _this = this;
      this.ui.playlistHeader.addClass('editable');
      this.ui.playlistTitleInput.select();

      $('body').off('click.disableEdit');
      $('body').on('click.disableEdit', function(e){

        if(!$(e.target).hasClass('playlist-title-editable') && $(e.target).parents('.playlist-title-editable').length === 0) {

          _this.submitTitleChange();
        }
      });
    },
    submitTitleChange: function() {

      $('.playback-header').removeClass('editable');
      $('body').off('click.disableEdit');
      var newTitle = $('.playlist-title-input').val();
      Playlist.Controller.sendNewPlaylistName(newTitle);
    },
    resetTitleChange: function() {

      $('body').off('click.disableEdit');
      this.ui.playlistHeader.removeClass('editable');
      this.ui.playlistTitleInput.val(this.model.get('title'));
    },
    escEditPlaylistTitle: function(e) {

      var pressedKey = e.keyCode || e.which;

      // If esc key pressed, disable edit state
      if(pressedKey === 27) {

        this.resetTitleChange();
      }
      // If enter pressed, disable edit and submit change
      else if(pressedKey === 13) {

        e.preventDefault();
        this.submitTitleChange();
      }
    },
    updateTitle: function() {

      var newTitle = this.model.get('title');
      this.resetTitleChange();
      this.$('.playlist-title').text(newTitle);
    },
    focusTrackSearch: function(e) {

      e.preventDefault();
      $('.track-search-input').focus();
    }
  });
});
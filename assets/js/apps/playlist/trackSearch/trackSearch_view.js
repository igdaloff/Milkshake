TWM.module('Playlist.TrackSearch', function(TrackSearch, TWM, Backbone, Marionette, $, _){

  TrackSearch.SearchResult = Marionette.ItemView.extend({
    template: 'track-search-result',
    tagName: 'tr',
    className: 'track-search-result basic-table-row',
    events: {
      'click .toggle-track-preview': 'toggleTrackPreview',
      'click .track-search-result-add': 'addTrack'
    },
    modelEvents: {
      'change:isPlaying': 'togglePreviewButtonState',
      'change:previewProgress': 'updatePreviewProgress'
    },
    toggleTrackPreview: function(e){

      e.preventDefault();
      var $button = $(e.currentTarget);
      // Add the loading class to show some kind of loading indicator and remove other loading classes
      $('.loading').removeClass('loading');
      $button.addClass('loading');
      // If the preview is already playing, stop it
      if(this.model.get('isPlaying')) {

        TrackSearch.Controller.stopTrackPreview(this.model);
      }
      // Otherwise start a preview
      else {

        TrackSearch.Controller.previewTrack(this.model);
      }
    },
    togglePreviewButtonState: function() {

      var $button = this.$('.toggle-track-preview');
      // Regardless of new state, remove the loading class
      $button.removeClass('loading');
      if(this.model.get('isPlaying')) {

        $button.addClass('playing');
      }
      else {

        $button.removeClass('playing');
      }
    },
    highlightAddedTrack: function(e){
      var $searchResultRow = $(e.target).parents('.track-search-result');

      $searchResultRow.addClass('highlight');

      setTimeout(function(){
        $searchResultRow.removeClass('highlight');
      }, 2000);
    },
    addTrack: function(e){

      e.preventDefault();

      // #Hack - use the existence of playlist-create el to determine whether this is new or existing playlist
      if($('.playlist-create').length) {

        TrackSearch.Controller.addTrack(this.model);
      }
      else {

        TWM.Playlist.Controller.addTrackToPlaylist(this.model.attributes);
      }
      this.highlightAddedTrack(e);
    },
    /**
     * Update preview progress
     * Based on the percentage progress of the preview, calculate how much we should rotate
     * the two pie halves by, based on 180 degrees each
     */
    updatePreviewProgress: function(e) {

      var progress = this.model.get('previewProgress');
      var firstHalf = 0, secondHalf = 0;
      var $firstHalf = this.$('.pie.right');
      var $secondHalf = this.$('.pie.left');
      if(progress >= 50) {

        firstHalf = 180;
        secondHalf = (progress - 50) / 50 * 180;
      }
      else {

        firstHalf = progress / 50 * 180;
        secondHalf = 0;
      }
      var firstHalfTransform = 'rotate(' + Math.floor(firstHalf) + 'deg)';
      var secondHalfTransform = 'rotate(' + Math.floor(secondHalf) + 'deg)';

      $firstHalf.css({
        '-webkit-transform': firstHalfTransform,
        '-ms-transform': firstHalfTransform,
        'transform': firstHalfTransform
      });
      $secondHalf.css({
        '-webkit-transform': secondHalfTransform,
        '-ms-transform': secondHalfTransform,
        'transform': secondHalfTransform
      });
    }
  });

  TrackSearch.SearchForm = Marionette.CompositeView.extend({
    childView: TrackSearch.SearchResult,
    childViewContainer: '.track-search-results',
    className: 'track-search',
    template: 'track-search-form',
    events: {
      'submit form': 'searchTracks'
    },
    initialize: function(opts) {

      var _this = this;
      this.listenTo(this.collection, 'reset', function() {

        if(this.collection.length === 0) {

          this.noResultsMessage();
        }
      });

      if(opts.autoSearch) {

        this.listenTo(this, 'render', function() {

          this.$('.track-search-query').off('keyup.autosearch');
          this.$('.track-search-query').on('keyup.autosearch', function(e) {

            _this.autoSearch(e);
          });
        });
      }
    },
    onRender: function() {

      // On render, display the current query in the search input
      if(typeof this.collection.query === 'string') {

        this.$('.track-search-query').val(this.collection.query);
      }
    },
    searchTracks: function(e) {

      e.preventDefault();
      var $form = $(e.currentTarget);
      var query = this.$('.track-search-query').val();

      // Add the loading class to the input
      this.$('.track-search-query').addClass('loading');
      // Execute the query
      TrackSearch.Controller.searchTracks(query);
    },
    onRenderCollection: function() {

      // Add class for results transition
      $(this.childViewContainer).parent().addClass('visible');
      // Remove the loading class on completion
      this.$('.track-search-query').removeClass('loading');
    },
    /**
     * No results message
     * Display a message to notify the user that there are no results for their query
     */
    noResultsMessage: function() {

      // Set the query string in the template
      this.$('.search-term').text(this.collection.query);
      // remove the loading class
      this.$('.track-search-query').removeClass('loading');
      // show the no results message
      $('.no-results-message').fadeIn();
      // hide the message as soon as new results are added
      this.listenToOnce(this.collection, 'reset', function() {

        $('.no-results-message').hide();
      });
    },
    autoSearch: _.throttle(function(e) {

      var query = e.target.value.trim();
      if(query.length && (typeof this.query === 'undefined' || this.query !== query)) {

        this.$el.find('form').trigger('submit');
        this.query = query;
      }
    }, 1000, {leading: false})
  });

});
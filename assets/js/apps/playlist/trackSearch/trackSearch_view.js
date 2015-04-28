TWM.module('Playlist.TrackSearch', function(TrackSearch, TWM, Backbone, Marionette, $, _){

  TrackSearch.SearchResult = Marionette.ItemView.extend({
    template: 'track-search-result',
    tagName: 'tr',
    className: 'track-search-result basic-table-row',
    events: {
      'click .track-search-result-add ': 'addTrack'
    },
    indicateAddedTrack: function(e){
      var $searchResultRow = $(e.target).parents('.track-search-result');

      $searchResultRow.addClass('highlight');
      $searchResultRow.addClass('added-track');

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

        TWM.Playlist.Controller.sendTrackToPlaylist(this.model.attributes);
      }
      this.indicateAddedTrack(e);
      this.makeNewTracksDraggable();
    },
    makeNewTracksDraggable: function(e) {

      // Allow tracks for new playlists to be dragged and sorted
      if(!$('.ui-sortable').length){
        $('.playback-track-list tbody').sortable({
          cancel: '.played, .current',
          placeholder: 'track-reorder-gap',
          update: function(e, ui) {

            var trackModelId = ui.item.data('id');
            var newRank = ui.item.index();
            TWM.Playlist.Controller.sendNewTrackOrder(trackModelId, newRank);
          }
        }).disableSelection();
      }
    }
  });

  TrackSearch.SearchForm = Marionette.CompositeView.extend({
    childView: TrackSearch.SearchResult,
    childViewContainer: '.track-search-results',
    className: 'track-search',
    template: 'track-search-form',
    events: {
      'submit form': 'searchTracks',
      'click .track-search-result-source': 'mutePlaylistForPreview',
      'click .track-search-close': 'closeSearch',
      'keydown': 'closeSearchEsc'
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

          this.$('.track-search-input').off('keyup.autosearch');
          this.$('.track-search-input').on('keyup.autosearch', function(e) {

            _this.autoSearch(e);
          });
        });
      }
    },
    onRender: function() {

      // On render, display the current query in the search input
      if(typeof this.collection.query === 'string') {

        this.$('.track-search-input').val(this.collection.query);
      }
    },
    searchTracks: function(e) {

      e.preventDefault();
      var $form = $(e.currentTarget);
      var query = this.$('.track-search-input').val();
      var $searchResultContainer = $('.track-search-results-container');

      if(query !== ''){
        // Add the loading class to the input
        this.$('.search-submit').addClass('loading');
        // Execute the query
        TrackSearch.Controller.searchTracks(query);

        // Show close search button
        $('.track-search-close').fadeIn('fast');
      }

      $searchResultContainer.scrollTop(0);
    },
    onRenderCollection: function() {

      // Add class for results transition
      $(this.childViewContainer).parent().addClass('visible');
      // Remove the loading class on completion
      this.$('.search-submit').removeClass('loading');

      if( $('.track-search-results').height() >= $('.track-search-results-container').height() ){
        $('.track-search-results-container').perfectScrollbar();
      } else {
        $('.track-search-results-container').perfectScrollbar('destroy');
      }
    },
    /**
     * No results message
     * Display a message to notify the user that there are no results for their query
     */
    noResultsMessage: function() {

      // Set the query string in the template
      this.$('.search-term').text(this.collection.query);
      // remove the loading class
      this.$('.search-submit').removeClass('loading');
      // show the no results message
      $('.no-results-message').addClass('visible');
    },
    mutePlaylistForPreview: function() {

      var muted = TWM.Playlist.Controller.muteToggle();
      var $muteToggle = $('.mute-toggle');

      if(muted) {

        $muteToggle.addClass('muted');
      }
      else {

        $muteToggle.removeClass('muted');
      }
    },
    closeSearch: function(e) {

      e.preventDefault();
      TrackSearch.Controller.cancelSearch();
      $('.track-search-results-container').removeClass('visible');
      $('.track-search-close').fadeOut('fast');
      $('.track-search-input').val('').focus();
      $('.no-results-message.visible').removeClass('visible');
      this.$('.search-submit').removeClass('loading');
    },
    closeSearchEsc: function(e) {

      var code = e.keyCode || e.which;
      if(code == 27) {
        this.closeSearch(e);
      }
    }
  });

});
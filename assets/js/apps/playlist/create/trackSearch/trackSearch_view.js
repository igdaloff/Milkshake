TWM.module("Playlist.Create.TrackSearch", function(TrackSearch, TWM, Backbone, Marionette, $, _){

  TrackSearch.SearchResult = Marionette.ItemView.extend({
    template: "track-search-result",
    tagName: "tr",
    className: "track-search-result",
    trackPreviewLength: 5,
    events: {
      "click .preview-track": "toggleTrackPreview",
      "click .track-search-result-add": "addTrack",
    },
    modelEvents: {
      "change:isPlaying": "togglePreviewButtonState"
    },
    toggleTrackPreview: function(e){

      e.preventDefault();
      var $button = $(e.currentTarget);
      // Add the loading class to show some kind of loading indicator
      $button.addClass("loading");
      // If the preview is already playing, stop it
      if(this.model.get("isPlaying")) {

        TrackSearch.Controller.stopTrackPreview(this.model);
      }
      // Otherwise start a preview
      else {

        TrackSearch.Controller.previewTrack(this.model, this.trackPreviewLength);
      }
    },
    togglePreviewButtonState: function() {

      var $button = this.$(".preview-track");
      // Regardless of new state, remove the loading class
      $button.removeClass("loading");
      if(this.model.get("isPlaying")) {

        $button.addClass("playing");
      }
      else {

        $button.removeClass("playing");
      }
    },
    addTrack: function(e){
      e.preventDefault();
      TrackSearch.Controller.addTrack(this.model);
    }
  });

  TrackSearch.SearchForm = Marionette.CompositeView.extend({
    childView: TrackSearch.SearchResult,
    childViewContainer: ".track-search-results",
    tagName: "form",
    className: "track-search",
    template: "track-search-form",
    events: {
      "submit": "searchTracks"
    },
    onRender: function() {

      // On render, display the current query in the search input
      if(typeof this.collection.query === "string") {

        this.$(".track-search-query").val(this.collection.query);
      }
    },
    searchTracks: function(e) {

      e.preventDefault();
      var $form = $(e.currentTarget);
      var query = this.$(".track-search-query").val();
      var $searchResultsContainer = $('.track-search-results-container');

      // Add the loading class to the input
      this.$(".track-search-query").addClass("loading");
      // Execute the query
      TrackSearch.Controller.searchTracks(this.collection, query, _.bind(function() {

        // Remove the loading class on completion
        this.$(".track-search-query").removeClass("loading");
        $searchResultsContainer.addClass("visible");
      }, this));
    }
  });

});
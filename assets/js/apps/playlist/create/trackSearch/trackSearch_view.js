TWM.module("Playlist.Create.TrackSearch", function(TrackSearch, TWM, Backbone, Marionette, $, _){

  TrackSearch.SearchResult = Marionette.ItemView.extend({
    template: "track-search-result",
    tagName: "tr",
    className: "track-search-result",
    events: {
      "click .preview-track": "toggleTrackPreview",
      "click .track-search-result-add": "addTrack"
    },
    modelEvents: {
      "change:isPlaying": "togglePreviewButtonState"
    },
    toggleTrackPreview: function(e){

      e.preventDefault();
      var $button = $(e.currentTarget);
      // Add the loading class to show some kind of loading indicator and remove other loading classes
      $(".loading").removeClass("loading");
      $button.addClass("loading");
      // If the preview is already playing, stop it
      if(this.model.get("isPlaying")) {

        TrackSearch.Controller.stopTrackPreview(this.model);
      }
      // Otherwise start a preview
      else {

        TrackSearch.Controller.previewTrack(this.model);
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
    initialize: function() {

      this.listenTo(this.collection, "reset", function() {

        if(this.collection.length === 0) {

          this.noResultsMessage();
        }
      });
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
      // Remove class for results so we can transition in new ones
      $(this.childViewContainer).parent().removeClass("visible");

      // Add the loading class to the input
      this.$(".track-search-query").addClass("loading");
      // Execute the query
      TrackSearch.Controller.searchTracks(query);
    },
    onRenderCollection: function() {

      // Add class for results transition
      $(this.childViewContainer).parent().addClass("visible");
      // Remove the loading class on completion
      this.$(".track-search-query").removeClass("loading");
    },
    /**
     * No results message
     * Display a message to notify the user that there are no results for their query
     */
    noResultsMessage: function() {

      // Set the query string in the template
      this.$(".search-term").text(this.collection.query);
      // remove the loading class
      this.$(".track-search-query").removeClass("loading");
      // show the no results message
      $(".no-results-message").fadeIn();
      // hide the message as soon as new results are added
      this.listenToOnce(this.collection, "reset", function() {

        $(".no-results-message").hide();
      });
    }
  });

});
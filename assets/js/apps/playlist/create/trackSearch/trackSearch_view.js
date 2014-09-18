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
      if(this.model.get("isPlaying")) {

        $button.addClass("playing").text("Stop");
      }
      else {

        $button.removeClass("playing").text("Preview");
      }      
    },
    addTrack: function(e){
      e.preventDefault();
      TrackSearch.Controller.addTrack(this.model);
    }
  });

  TrackSearch.SearchResults = Marionette.CollectionView.extend({
    itemView: TrackSearch.SearchResult,
    tagName: "table",
    className: "track-search-results"
  });

});
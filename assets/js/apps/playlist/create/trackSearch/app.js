TWM.module("Playlist.Create.TrackSearch", function(TrackSearch, TWM, Backbone, Marionette, $, _){

  // prevent starting with parent
  this.startWithParent = false;

  // Declare a region to display our results in
  var resultsRegion = new Marionette.Region({
    el: ".track-search-results-container"
  });

  var newSearchQuery = function(query){

    var resultsCollection = TWM.request("newTrackSearch:entities", query);
    var resultsView = new TrackSearch.SearchResults({
      collection: resultsCollection
    });
    resultsRegion.show(resultsView);
    // Do the search, do it now
    resultsCollection.fetch();
  }

  TrackSearch.on("start", function(){

    // Bind the search form to a trackSearch object
    $(".track-search").on("submit", function(e){
      e.preventDefault();
      var query = $(this).find(".track-search-query").val();
      newSearchQuery(query);
    });
  });

});
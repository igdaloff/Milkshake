TWM.module("Playlist.Create.TrackSearch", function(TrackSearch, TWM, Backbone, Marionette, $, _){

  // prevent starting with parent
  this.startWithParent = false;

  TrackSearch.on("start", function(){

    // Declare a region to contain our search form
    var searchFormContainer = new Marionette.Region({
      el: ".track-search-container"
    })

    // Create a collection to hold our results and pass them into a search form view
    var resultsCollection = TWM.request("newTrackSearch:entities");
    var searchForm = new TrackSearch.SearchForm({
      collection: resultsCollection
    });
    searchFormContainer.show(searchForm);
  });

});
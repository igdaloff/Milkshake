TWM.module('Playlist.TrackSearch', function(TrackSearch, TWM, Backbone, Marionette, $, _){

  var playlistManager, currentSearch;

  TrackSearch.Controller = {
    searchTracks: function(query) {

      var resultsCollection = TWM.request('trackSearch:resultsCollection');
      resultsCollection.query = query;
      // Abort existing search if there is one
      if(typeof currentSearch !== 'undefined' && currentSearch.abort === 'function') {

        TrackSearch.Controller.cancelSearch();
      }
      currentSearch = resultsCollection.fetch({
        reset: true
      });
      TWM.trigger('trackSearch:newSearch', query);
    },
    cancelSearch: function() {

      currentSearch.abort();
    }
  };
});
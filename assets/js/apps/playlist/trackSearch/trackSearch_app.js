TWM.module("Playlist.TrackSearch", function(TrackSearch, TWM, Backbone, Marionette, $, _){

  // prevent starting with parent
  this.startWithParent = false;

  TrackSearch.on('start', function(){

    // Declare a region to contain our search form
    var searchFormContainer = new Marionette.Region({
      el: '.track-search-container'
    });

    // Create a collection to hold our results and pass them into a search form view
    var resultsCollection = TWM.request('trackSearch:entities');

    var searchForm = new TrackSearch.SearchForm({
      collection: resultsCollection,
      autoSearch: $('.playlist-create').length
    });
    searchFormContainer.show(searchForm);

    // Set up a request handler to get the resutls collection
    TWM.reqres.setHandler("trackSearch:resultsCollection", function() {

      return resultsCollection;
    });
  });

  //Show playlist create button once a user has entered a character into input field
  var $playlistTitleInput = $('.new-playlist-title'),
      $playlistCreateButton = $('.playlist-create-submit');

  $playlistTitleInput.keyup( function(){
    $playlistCreateButton.addClass('active');
  });


  //Show search field again if user selects track slot after already choosing 3
  $('.change-track-button').on('click', function(){
    $('.playlist-create-title-container').fadeOut();
    $('.track-search-container').delay(500).fadeIn();
  });


});
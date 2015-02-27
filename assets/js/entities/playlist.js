TWM.module("Entities", function(Entities, TWM, Backbone, Marionette, $, _){

  // Search result
  Entities.Track = Backbone.Model.extend({
    defaults: {
      isPlaying: false,
      previewProgress: 0
    },
    initialize: function() {

      // When the track is not playing, set the previewProgress to 0
      this.listenTo(this, 'change:isPlaying', function() {

        if(!this.get('isPlaying')) {
          
          this.set('previewProgress', 0);
        }
      });

      // Save the ID of the parent playlist into the model if there is one
      if(typeof(this.collection) === 'object' && typeof(this.collection.id) !== 'undefined') {

        this.set('playlistId', this.collection.id);
      }
    },
    /*
    * Parse the response and add a human-readable 'minutes' value for the duration
    */
    parse: function(response){
      response.minutes = this.secondsToMinutes(response.duration);
      return response;
    },
    /*
    * Convert seconds to human-readable minutes
    */
    secondsToMinutes: function(seconds){
      var minutes = Math.floor(seconds / 60).toString();
      var remainderSeconds = Math.round(seconds - minutes * 60).toString();
      if(remainderSeconds.length < 2) {
        remainderSeconds = "0" + remainderSeconds;
      }
      return minutes + ":" + remainderSeconds;
    }
  });

  // Playlist (collection of tracks)
  Entities.Playlist = Backbone.Collection.extend({
    model: Entities.Track,
    initialize: function(opts) {

      this.id = playlistId;
    },
    url: function() {

      return '/' + this.id;
    }
  });

  // Search result collection
  Entities.TrackSearchResults = Backbone.Collection.extend({
    model: Entities.Track,
    baseUrl: "/search/",
    query: "",
    url: function(){

      return this.baseUrl + "?q=" + this.query;
    },
    /**
    * Set Query
    *
    * If the new query does not match the old one, update this.query and make a
    * one-time listener to empty any old results when we next sync
    */
    setQuery: function(query){
      if(this.query != query){
        this.query = query;
        this.listenToOnce(this, "request", function(){

          this.reset();
        });
      }
    }
  });

  // Set our req/res handlers

  TWM.reqres.setHandler("newTrackSearch:entities", function(models){

    var trackSearchResults = new Entities.TrackSearchResults(models);
    return trackSearchResults;
  });

  TWM.reqres.setHandler("newPlaylist:entities", function(models){

    var playlist = new Entities.Playlist(models);
    return playlist;
  });

});
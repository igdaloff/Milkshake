TWM.module("Entities", function(Entities, TWM, Backbone, Marionette, $, _){

  Entities.Track = Backbone.Model.extend({
    defaults: {
      isPlaying: false,
      hasPlayed: false,
      previewProgress: 0
    },
    initialize: function() {

      // If there is no ID, but we have an _id attribute, use that to set the id
      if(typeof(this.get('_id')) === 'string') {

        this.id = this.get('_id');
      }

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
    initialize: function() {

      this.listenTo(this, 'change:isPlaying', this.updateTracksPlayStatus);
    },
    url: function() {

      return '/' + this.id;
    },
    /** 
     * Update Tracks' Play Status
     * When this track is set to isPlaying == true, update all the models in the collection.
     * We need to set other tracks to isPlaying = false, and set all previous tracks in the
     * collection to hasPlayed = true
     */
    updateTracksPlayStatus: function(playingTrack) {

      if(playingTrack.get('isPlaying')) {

        var playingTrackIndex = this.models.indexOf(playingTrack);
        for(var i = 0; i < this.models.length; i++) {

          var model = this.models[i];
          if(i !== playingTrackIndex) {

            model.set('isPlaying', false);
          }
          if(i < playingTrackIndex) {

            model.set('hasPlayed', true);
          }
        }
      }
    },
    getTotalDuration: function() {

      var duration = 0;
      for(var i = 0; i < this.models.length; i++) {

        var model = this.models[i];
        duration += model.get('duration');
      }
      return duration;
    }
  });

  // Search result collection
  Entities.TrackSearchResults = Entities.Playlist.extend({
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
    setQuery: function(query) {
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
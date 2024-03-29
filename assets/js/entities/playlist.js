TWM.module("Entities", function(Entities, TWM, Backbone, Marionette, $, _){

  Entities.Playlist = Backbone.Model.extend({
    defaults: {
      currentTime: 0,
      numTracks: 0
    },
    initialize: function() {

      // If there is no ID, but we have an _id attribute, use that to set the id
      if(typeof(this.get('_id')) === 'string') {

        this.id = this.get('_id');
      }

      // Set up a collection at this.tracks
      if(typeof(this.get('tracks')) === 'object') {

        this.tracks = new Entities.Tracks(this.get('tracks'));
        // Remove the tracks object from the model's attributes
        this.unset('tracks', {
          silent: true
        });
        // Listen to tracks being added/removed from the collection and update the model's totalDuration attr
        this.listenTo(this.tracks, 'add remove', function() {

          this.set('totalDuration', this.tracks.getTotalDuration());
          this.set('numTracks', this.tracks.length);
          // Save the name of the last track added, we need this for the homepage recent playlist table
          if(this.tracks.length) {
            
            this.set('lastTrackAdded', this.tracks.at(this.tracks.length - 1).get('title'));
          }
        });
      }

      this.listenTo(this, 'change', this.setTimeUpdated);
      this.listenTo(this, 'change', _.debounce(this.save, 250));
    },
    setTimeUpdated: function() {

      this.set('updated', Date.now());
    },
    /**
     * Save playlist to local
     * Add this playlist model to a locally stored array of playlist objects.
     */
    save: function() {

      var recentPlaylists;
      var playlistUpdated = false;
      if (Modernizr.localstorage) {

        var recentPlaylistsStr = localStorage.getItem('recentPlaylists');
        // Parse the stringify'd array
        if(recentPlaylistsStr !== null && recentPlaylistsStr.length) {
          recentPlaylists = JSON.parse(recentPlaylistsStr);
        }
        // If the recentPlaylists array has not yet been created, add it in there
        if(typeof recentPlaylists === 'undefined' || recentPlaylists === null) {

          recentPlaylists = [];
        }
        // Initialize the object we want to save
        var playlistDataToSave = _.clone(this.attributes);
        playlistDataToSave.id = this.id;
        // Check whether the playlist already exists, if so update it
        for(var i = 0; i < recentPlaylists.length; i++) {

          var playlist = recentPlaylists[i];
          if(playlist.id === playlistDataToSave.id) {

            recentPlaylists[i] = playlistDataToSave;
            playlistUpdated = true;
          }
        }
        // If the playlist wasn't already in localStorage, it hasn't been updated. Let's add it now
        recentPlaylists.push(playlistDataToSave);
        // Stringify the array again so we can save it in local storage
        recentPlaylistsStr = JSON.stringify(recentPlaylists);
        localStorage.setItem('recentPlaylists', recentPlaylistsStr);
        return recentPlaylists;
      }
    }
  });

  Entities.Track = Backbone.Model.extend({
    defaults: {
      currentTime: 0,
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

      // If there is a 'duration' but no 'originalDuration' attribute, set it from 'duration'
      if(typeof(this.get('originalDuration')) === 'undefined' && typeof(this.get('duration')) !== 'undefined') {

        this.set('originalDuration', this.get('duration'));
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
  Entities.Tracks = Backbone.Collection.extend({
    model: Entities.Track,
    comparator: 'rank',
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
            model.set('currentTime', model.get('duration'));
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
  Entities.TrackSearchResults = Entities.Tracks.extend({
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

  TWM.reqres.setHandler("tracks:entities", function(data){

    var tracks = new Entities.Tracks(data);
    return tracks;
  });

  TWM.reqres.setHandler("playlist:entities", function(models){

    var playlist = new Entities.Playlist(models);
    return playlist;
  });

  TWM.reqres.setHandler("trackSearch:entities", function(models){

    var trackSearchResults = new Entities.TrackSearchResults(models);
    return trackSearchResults;
  });

});
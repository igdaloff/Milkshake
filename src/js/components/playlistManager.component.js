TWM.module('Components', function(Components, TWM, Backbone, Marionette, $, _){

  TWM.Components.PlaylistManager = (function(){

    function PlaylistManager(data){

      this.tracks = data.tracks || {};
      this.currentTrackIndex = null;
      this.isPlaying = false;
      // Create a jQuery element that will contain our embed codes and append it to the body
      this.embedsId = 'playlist-embeds';
      this.$embeds = $('<div></div>').attr('id', this.embedsId).appendTo('body');
    }

    PlaylistManager.prototype.startPlaylist = function() {

      this.playTrack(0);
      $(this).on('ended:track', this.next);
    };

    PlaylistManager.prototype.stopPlaylist = function() {

      $(this).unbind();
    };

    PlaylistManager.prototype.loadFromTotalTime = function(startTime, callback) {

      var requestedTrack = this.getTrackFromTotalTime(startTime);

      this.onTrackReady(requestedTrack.trackIndex, function(pop) {

        pop.currentTime(requestedTrack.trackTime);
        pop.on( 'canplayall', function( event ) {
          
          callback(pop);
        });
      });
    }

    PlaylistManager.prototype.playTrack = function(trackIndex, trackTime) {
      
      if(typeof trackTime === "undefined") {
        trackTime = 0;
      }
      this.onTrackReady(trackIndex, function(popcorn) {

        popcorn.play(trackTime);
      });
    };

    PlaylistManager.prototype.onTrackReady = function(trackIndex, callback) {

      if(typeof callback !== 'function') {

        console.error('Playlist Manager: Callback cannot be played');
        return;
      }
      var track = this.getTrackData(trackIndex);
      this.emptyEmbedsEl();
      var pop = this.getPopcorn(track.url, true);
      if(track.source == 'soundcloud') {
        pop.on( 'canplayall', function( event ) {
          
          callback(pop);
        });
      }
      else {

        callback();
      }
      this.isPlaying = true;
      this.pop = pop;
      this.setCurrentTrackIndex(trackIndex);
      return this.pop;
    },

    PlaylistManager.prototype.getTrackData = function(trackIndex) {

      if(typeof(this.tracks[trackIndex]) == 'object') {

        return this.tracks[trackIndex];
      }
      else {
        return null;
      }
    }

    PlaylistManager.prototype.getCurrentTrackData = function() {

      if(this.getCurrentTrackIndex() !== null){

        return this.getTrackData(this.getCurrentTrackIndex());
      }
      else {
        return null;
      }
    }

    PlaylistManager.prototype.getCurrentTrackIndex = function() {    

      return this.currentTrackIndex;
    }
    
    PlaylistManager.prototype.setCurrentTrackIndex = function(trackIndex) {    

      this.currentTrackIndex = trackIndex;
      return this.getTrackData(trackIndex);
    }

    PlaylistManager.prototype.pause = function() {

      if(typeof this.pop.pause === "function") {
        this.pop.pause();
        return this.getTrackData(this.getCurrentTrackIndex());
      }
      else{
        return false;
      }
    };

    PlaylistManager.prototype.resume = function() {

      this.pop.play();
      return this.getTrackData(this.getCurrentTrackIndex());
    };

    PlaylistManager.prototype.stop = function() {

      this.pop.destroy();
      this.setCurrentTrackIndex(null);
      this.isPlaying = false;
      this.emptyEmbedsEl();
    }

    PlaylistManager.prototype.emptyEmbedsEl = function() {
      
      return this.$embeds.html('');
    }

    PlaylistManager.prototype.togglePlayPause = function(trackIndex) {

      if(this.getCurrentTrackIndex() !== null) {

        if(this.isPlaying){
          this.pause();
        }
        else{
          this.resume();
        }
      }
      else if(typeof(trackIndex) != 'undefined') {

        this.playTrack(trackIndex)
      }
      else {

        this.startPlaylist();
      }
    };

    PlaylistManager.prototype.next = function() {

      var nextTrackIndex = this.getCurrentTrackIndex() + 1;
      this.stop();
      if(nextTrackIndex + 1 <= this.tracks.length) {

        this.playTrack(nextTrackIndex);
        return this.getTrackData(nextTrackIndex);
      }
      else {

        this.stopPlaylist();
        return null;
      }
    }

    PlaylistManager.prototype.previous = function() {

      var prevTrackIndex = this.getCurrentTrackIndex() - 1;
      this.stop();
      if(prevTrackIndex >= 0) {

        this.playTrack(prevTrackIndex);
        return this.getTrackData(prevTrackIndex);
      }
      else {

        this.stopPlaylist();
        return null;
      }
    }

    PlaylistManager.prototype.getPlaylistDuration = function() {

      var playlistDuration = 0;
      // Loop over previous tracks and add up the time
      for(var trackIndex in this.tracks) {

        var track = this.tracks[trackIndex];
        playlistDuration += track.duration;
      }
      return playlistDuration;
    }

    PlaylistManager.prototype.getCurrentTotalTime = function() {

      var currentTrackIndex = this.getCurrentTrackIndex();
      var prevTrackDurations = 0;
      
      // Loop over previous tracks and add up the time
      for(var i = 0; i < currentTrackIndex; i++) {

        var track = this.tracks[i];
        prevTrackDurations += track.duration;
      }
      return prevTrackDurations + this.pop.currentTime();
    }

    PlaylistManager.prototype.getTrackFromTotalTime = function(totalTime) {

      var timeCounter = 0;
      var startTrack = 0;
      var requestedTrackTime;
      // Loop over tracks and determine which track contains the requested start time
      for(trackIndex in this.tracks) {

        var track = this.tracks[trackIndex];
        timeCounter += track.duration;
        if(totalTime < timeCounter) {

          requestedTrackTime = totalTime - (timeCounter - track.duration);
          break;
        }
        else {
          startTrack++;
        }
      }
      return {
        trackIndex: startTrack,
        trackTime: requestedTrackTime
      };
    }

    PlaylistManager.prototype.getPopcorn = function(trackUrl) {

      var pop = Popcorn.smart( '#' + this.embedsId, trackUrl);
      pop.autoplay(false);
      // Bind popcorn events to triggers on the 'this' object
      pop.on('ended', $.proxy(function(){

        $(this).trigger('ended:track');
      }, this));
      pop.on('playing', $.proxy(function(){

        $(this).trigger('playing:track');
        this.isPlaying = true;
      }, this));
      pop.on('pause', $.proxy(function(){

        $(this).trigger('pause:track');
        this.isPlaying = false;
      }, this));
      pop.on('timeupdate', $.proxy(function(){

        $(this).trigger('timeupdate:track', pop.currentTime());
      }, this));
      return pop;
    };

    return PlaylistManager;

  })();

  TWM.reqres.setHandler('playlistManager:components', function(data){ 
    
    return new Components.PlaylistManager(data);
  });

});
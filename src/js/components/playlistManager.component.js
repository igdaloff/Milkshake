TWM.module('Components', function(Components, TWM, Backbone, Marionette, $, _){

  TWM.Components.PlaylistManager = (function(){

    function PlaylistManager(data){

      this.tracks = data.tracks || {};
      this.currentTrackIndex = null;
      this.isPlaying = false;
      // Create a jQuery element for each track that will contain the embedded player, create a Popcorn instance for each
      this.embedsId = 'playlist-embeds';
      for(i in this.tracks) {

        var track = this.tracks[i];
        var trackEmbedId = this.embedsId.toString() + '-' + i;
        var $trackEmbed = $('<div></div>').attr('id', trackEmbedId).appendTo('body');
        this.tracks[i].embed = this.initTrackEmbed(track, trackEmbedId);
      }
    }

    PlaylistManager.prototype.initTrackEmbed = function(track, domId) {

      var pop = Popcorn.smart( '#' + domId, track.url);
      pop.autoplay(false);
      // Bind popcorn events to triggers on the 'this' object
      pop.on('ended', $.proxy(function(){

        $(this).trigger('ended:track');
        this.next()
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

    PlaylistManager.prototype.startPlaylist = function() {

      this.playTrack(0);
    };

    PlaylistManager.prototype.stopPlaylist = function() {

      this.stopAll();
      $(this).unbind();
    };

    PlaylistManager.prototype.loadFromTotalTime = function(startTime, callback) {

      var requestedTrack = this.getTrackFromTotalTime(startTime);

      this.onTrackReady(requestedTrack.trackIndex, function(track) {

        track.embed.currentTime(requestedTrack.trackTime);
        track.embed.on( 'canplayall', function( event ) {
          
          callback(track);
        });
      });
    }

    PlaylistManager.prototype.playTrack = function(trackIndex, trackTime) {
      
      var _this = this;
      if(typeof trackTime === "undefined") {
        trackTime = 0;
      }
      this.onTrackReady(trackIndex, function(track) {

        track.embed.play(trackTime);
        _this.setCurrentTrackIndex(trackIndex);
      });
    };

    PlaylistManager.prototype.stopAll = function() {

      for(i in this.tracks) {

        var trackEmbed = this.tracks[i].embed;
        trackEmbed.pause();
      }
    };

    PlaylistManager.prototype.onTrackReady = function(trackIndex, callback) {

      if(typeof callback !== 'function') {

        console.error('Playlist Manager: Callback cannot be played');
        return;
      }
      var track = this.getTrackData(trackIndex);
      if(track.source == 'soundcloud') {
        track.embed.on( 'canplayall', function( event ) {
          
          callback(track);
        });
      }
      else {

        callback(track);
      }
      return this.pop;
    };

    PlaylistManager.prototype.getTrackData = function(trackIndex) {

      if(typeof(this.tracks[trackIndex]) == 'object') {

        return this.tracks[trackIndex];
      }
      else {
        return null;
      }
    };

    PlaylistManager.prototype.getCurrentTrackData = function() {

      if(this.getCurrentTrackIndex() !== null){

        return this.getTrackData(this.getCurrentTrackIndex());
      }
      else {
        return null;
      }
    };

    PlaylistManager.prototype.getCurrentTrackIndex = function() {    

      return this.currentTrackIndex;
    };
    
    PlaylistManager.prototype.setCurrentTrackIndex = function(trackIndex) {    

      this.currentTrackIndex = trackIndex;
      return this.getTrackData(trackIndex);
    };

    PlaylistManager.prototype.pause = function() {

      var track = this.getCurrentTrackData();
      if(typeof track.embed.pause === "function") {
        track.embed.pause();
      }
      else{
        return false;
      }
    };

    PlaylistManager.prototype.resume = function() {

      var track = this.getCurrentTrackData();
      track.embed.play();
    };

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
      this.stopAll();
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
      return prevTrackDurations + this.getCurrentTrackData().embed.currentTime();
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

    return PlaylistManager;

  })();

  TWM.reqres.setHandler('playlistManager:components', function(data){ 
    
    return new Components.PlaylistManager(data);
  });

});
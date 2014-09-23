TWM.module('Components', function(Components, TWM, Backbone, Marionette, $, _){

  TWM.Components.PlaylistManager = (function(){

    function PlaylistManager(data){

      this.tracks = data.tracks || [];
      this.trackElements = [];
      this.currentTrackIndex = null;
      this.isPlaying = false;
      // Create a jQuery element for each track that will contain the embedded player, create a Popcorn instance for each
      this.popsId = 'playlist-embeds';
      this.popsClass = 'playlist-embed';
      for(i in this.tracks) {

        var track = this.tracks[i];
        var trackEmbedId = this.popsId.toString() + '-' + i;
        var $trackEmbed = $('<div></div>').attr('id', trackEmbedId).attr('class', this.popsClass).appendTo('body');
        // Save the Popcorn instance
        this.tracks[i].pop = this.initTrackEmbed(track, trackEmbedId);
        // Save the DOM element
        this.tracks[i].el = $trackEmbed;
      }
    }

    PlaylistManager.prototype.destroy = function() {

      for(i in this.tracks) {

        var track = this.tracks[i];
        // Destroy the popcorn object
        track.pop.destroy();
        // Remove the DOM element
        track.el.remove();
      }
    };

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

        track.pop.currentTime(requestedTrack.trackTime);
        // We'll add a litle delay because youtube can be slow
        window.setTimeout(function() {

          callback(track);
        }, 1000);
      });
    }

    PlaylistManager.prototype.playTrackSnippet = function(trackIndex, startTime, endTime, startCallback, endCallback) {

      var wait = this.tracks[trackIndex].source === "soundcloud";
      this.playTrack(trackIndex, startTime, wait, _.bind(function(track) {

        // Call the startCallback if it exists
        if(typeof startCallback === "function") {
          startCallback(track);
        }
        // Listen for the endtime and stop the track when we reach it
        track.pop.cue(endTime, function() {

          track.pop.pause();
          // Call the endCallback if it exists
          if(typeof endCallback === "function") {
            endCallback(track);
          }
        });
      }, this));
    }

    PlaylistManager.prototype.playTrack = function(trackIndex, trackTime, wait, callback) {

      var track = this.getTrackData(trackIndex);

      if(typeof trackTime === 'undefined') {
        trackTime = 0;
      }
      if(typeof wait === 'undefined') {
        wait = false;
      }

      // When the track was successfully jumped to the start time, call the callback if it exists
      if(typeof callback === "function") {

        track.pop.on("seeked", function() {

          callback(track);
          track.pop.off("seeked");
        });
      }

      this.setCurrentTrackIndex(trackIndex);
      if(wait) {
        this.onTrackReady(trackIndex, function(track) {

          track.pop.play(trackTime);
        });
      }
      else {
        track.pop.play(trackTime);
      }
    };

    PlaylistManager.prototype.stopAll = function() {

      for(i in this.tracks) {

        var trackEmbed = this.tracks[i].pop;
        trackEmbed.pause();
      }
    };

    PlaylistManager.prototype.onTrackReady = function(trackIndex, callback) {

      if(typeof callback !== 'function') {

        console.error('Playlist Manager: Callback cannot be played');
        return;
      }
      var track = this.getTrackData(trackIndex);
      track.pop.on('canplaythrough', function(e) {

        callback(track);
        track.pop.off('canplaythrough');
      });
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
      if(typeof track.pop.pause === 'function') {
        track.pop.pause();
      }
      else{
        return false;
      }
    };

    PlaylistManager.prototype.resume = function() {

      var track = this.getCurrentTrackData();
      track.pop.play();
    };

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
      return prevTrackDurations + this.getCurrentTrackData().pop.currentTime();
    }

    PlaylistManager.prototype.getCurrentTotalTimeString = function() {

      var secs = this.getCurrentTotalTime();
      var hours = Math.floor(secs / (60 * 60));
      var divisor_for_minutes = secs % (60 * 60);
      var minutes = Math.floor(divisor_for_minutes / 60);
      var divisor_for_seconds = divisor_for_minutes % 60;
      var seconds = Math.ceil(divisor_for_seconds);

      var hourStr = hours.toString();
      var secondStr = seconds.toString();
      var minuteStr = minutes.toString();
      var timeStr = "";
      
      // Add preceeding zeroes to seconds if necessary
      if(secondStr.length < 2) {
        secondStr = "0" + secondStr;
      }
      // Add preceeding zeroes to the minutes if necessary and the track is longer than 1 hour
      if(hours === 0 && minuteStr.length < 2) {
        minuteStr = "0" + minuteStr;
      }
      // Add hours if there are any
      if(hours > 0) {
        timeStr += hourStr + ":";
      }
      timeStr += minuteStr + ":" + secondStr;
      return timeStr;
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
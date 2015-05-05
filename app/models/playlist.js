var mongoose = require('mongoose');
var shortId = require('shortid');
var Schema = mongoose.Schema;
var _ = require('underscore');

var PlaylistSchema = new Schema({
  _id: {
    type: String,
    unique: true,
    default: shortId.generate
  },
  title: {
    type: String,
    default: 'Untitled Playlist'
  },
  created: {
    type: Date,
    default: Date.now()
  },
  updated: {
    type: Date,
    default: Date.now()
  },
  totalDuration: {
    type: Number,
    default: 0
  },
  startTime: Number,
  tracks: [{
    trackId: String,
    source: String,
    title: String,
    url: String,
    artwork: String,
    duration: Number,
    originalDuration: Number,
    rank: Number,
  }],
  numTracks: {
    type: Number,
    default: 0
  },
  lastTrackAdded: String
});

PlaylistSchema.pre('save', function(next){
  
  // Update the `updated` time field on each save
  this.updated = Date.now();
  this.numTracks = this.tracks.length;
  if(this.numTracks) {
    
    this.lastTrackAdded = this.tracks[this.numTracks - 1].title;
  }
  next();
});

/**
 * Add Track to Playlist
 * 
 * Given an object of track data, add it to the playlist model and return it in a callback.
 * This method will also update the total playlist duration and update the start time if there
 * was a gap between the playlist end and this track being added.
 *
 * @param {object} trackData An object of track data
 * @param {function} cb A callback function to execute after the track has been added and the playlist model is saved (updatedPlaylistModel)
 */
PlaylistSchema.method('addTrackToPlaylist', function(trackData, cb) {

  var newRank = this.tracks.length;
  trackData.rank = newRank;
  this.tracks.push(trackData);
  // Reset the start time if the duration of the playlist + start time is less than now
  // ie. this track is being added after the playlist finished
  var now = new Date().getTime();
  if(this.startTime + (this.totalDuration * 1000) < now) {

    this.startTime = now - (this.totalDuration * 1000);
  }
  // Now update the total playlist duration
  this.totalDuration += trackData.duration;
  this.save(function(err, updatedPlaylistModel) {

    // Callback if there is one
    if(typeof(cb) === 'function') {
        
      cb(updatedPlaylistModel);
    }
  });
});


PlaylistSchema.method('removeTrackFromPlaylist', function(trackId, cb) {

  // First get the current rank of the track to update
  var trackToDelete = _.findWhere(this.tracks, {
    id: trackId
  });
  // If the track wasn't found, cancel this
  if(typeof(trackToDelete) === 'undefined') {

    return cb(this, {});
  }
  var oldRank = trackToDelete.rank;
  var trackIndex = this.tracks.indexOf(trackToDelete);
  // Remove the track from the array
  this.tracks.splice(trackIndex, 1);
  this.totalDuration -= trackToDelete.duration;
  // If this wasn't the last track, re-order the ranks
  if(trackIndex < this.tracks.length) {

    // Get the next track's info, which is now at the index as the one we just deleted
    for(var i = oldRank; i < this.tracks.length; i++) {

      var trackToIncrement = this.tracks[i];
      if(typeof(trackToIncrement) !== 'undefined') {

        trackToIncrement.rank = trackToIncrement.rank - 1;
      }
    }
  }
  this.save(function(err, updatedPlaylistModel) {

    // Callback if there is one
    if(typeof(cb) === 'function') {

      cb(updatedPlaylistModel, trackToDelete);
    }
  });
});

/**
 * Reorder Tracks
 *
 * Given a track ID and a new rank, update the given track with the new ranking and adjusts all other
 * ranks accordingly. The playlist model is then saved and the callback is run.
 *
 * @param {string} trackId 
 * @param {int} newRank
 * @param {function} cb The callback to run after the ranks are updated and model saved (updatedPlaylistModel)
 */
PlaylistSchema.method('reorderTracks', function(trackId, newRank, cb) {

  // First get the current rank of the track to update
  var trackToUpdate = _.findWhere(this.tracks, {
    id: trackId
  });
  var oldRank = trackToUpdate.rank;
  var trackIndex = this.tracks.indexOf(trackToUpdate);

  // Update the ranks of tracks between the old and new positions
  var hi = oldRank > newRank ? oldRank : newRank;
  var lo = oldRank < newRank ? oldRank : newRank;

  for(var i = lo; i <= hi; i++) {

    var track = this.tracks[i];
    if(typeof(track) === 'undefined') {

      continue;
    }
    if(newRank > oldRank && i !== lo) {

      track.rank = i - 1;
    } 
    else if(i !== hi) {

      track.rank = i + 1;
    }
  }
  
  this.tracks[trackIndex].rank = newRank;

  // Sort the array based on the new rankings
  this.tracks = _.sortBy(this.tracks, function(o) {

    return o.rank;
  });
  this.save(function(err, updatedPlaylistModel) {

    // Callback if there is one
    if(typeof(cb) === 'function') {
      
      cb(updatedPlaylistModel);
    }
  });
});

/**
 * Truncate track at current time
 *
 * Calculate the current time of the current track and set that as the new duration for that track. This allows us to skip tracks.
 * 
 * @param {Function} cb The callback function to run after the new track duration has been set (updatedPlaylistModel, updatedTrackData)
 */
PlaylistSchema.method('truncateTrackAtCurrentTime', function(cb) {

  var currentUnixTime = new Date().getTime();
  var currentTime = (currentUnixTime - this.startTime) / 1000;
  var timeCounter = 0;
  var currentTrackIndex = 0;
  var currentTrackTime;
  var currentTrackOb;

  // Loop over tracks and determine which track contains the requested start time
  for(var i = 0; i < this.tracks.length; i++) {

    var track = this.tracks[i];
    timeCounter += track.duration;
    if(currentTime < timeCounter) {

      currentTrackTime = currentTime - (timeCounter - track.duration);
      break;
    }
    else {
      currentTrackIndex++;
    }
  }

  // Update the relevant track with the new time
  currentTrackOb = this.tracks[currentTrackIndex];

  if(typeof(currentTrackOb) !== 'undefined') {
    
    currentTrackOb.duration = currentTrackTime;
  }
  
  this.save(function(err, updatedPlaylistModel) {

    // Callback if there is one
    if(typeof(cb) === 'function') {
      
      cb(updatedPlaylistModel, currentTrackOb);
    }
  });
});

module.exports = mongoose.model('Playlist', PlaylistSchema);
var mongoose = require('mongoose');
var shortId = require('shortid');
var Schema = mongoose.Schema;
var _ = require('underscore');

var PlaylistSchema = new Schema({
  _id: {
    type: String,
    unique: true,
    'default': shortId.generate
  },
  title: String,
  created: Date,
  totalDuration: Number,
  startTime: Number,
  tracks: [{
    trackId: String,
    source: String,
    title: String,
    url: String,
    artwork: String,
    duration: Number,
    rank: Number,
  }]
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

  var newRank = this.tracks.length + 1;
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

  this.tracks.pull(trackId);
  this.totalDuration -= trackData.duration;
  this.save(function(err, updatedPlaylistModel) {

    // Callback if there is one
    if(typeof(cb) === 'function') {

      cb(updatedPlaylistModel);
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

  console.log('track id to update', trackId);
  // First get the current rank of the track to update
  var trackToUpdate = _.findWhere(this.tracks, {
    _id: trackId
  });
  console.log('track to update', trackToUpdate);
  var oldRank = trackToUpdate.rank;
  var trackIndex = this.tracks.indexOf(trackToUpdate);
  this.tracks[trackIndex].rank = newRank;

  // Update the ranks of tracks between the old and new positions
  var hi = oldRank > newRank ? oldRank : newRank;
  var lo = oldRank < newRank ? oldRank : newRank;

  for(var i = lo; i <= hi; i++) {

    var track = this.tracks[i - 1];
    if(newRank > oldRank && i !== lo) {

      track.rank = i - 1;
    } 
    else if(i !== hi) {

      track.rank = i + 1;
    }
  }
  console.log('track ranks:', this.tracks);
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

module.exports = mongoose.model('Playlist', PlaylistSchema);
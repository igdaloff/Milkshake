var mongoose = require('mongoose');
var shortId = require('shortid');
var Schema = mongoose.Schema;

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

module.exports = mongoose.model('Playlist', PlaylistSchema);
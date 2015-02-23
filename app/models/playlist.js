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
  // Callback if there is one
  if(typeof(cb) === 'function') {
    
    cb(this);
  }
});

PlaylistSchema.method('removeTrackFromPlaylist', function(trackId, cb) {

  this.tracks.pull(trackId);
  // Callback if there is one
  if(typeof(cb) === 'function') {
    
    cb(this);
  }
});

module.exports = mongoose.model('Playlist', PlaylistSchema);
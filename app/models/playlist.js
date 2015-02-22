var mongoose = require('mongoose');
var shortId = require('shortid');
var Schema = mongoose.Schema;

var schema = new Schema({
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
  }],
  methods: {
    addTrackToPlaylist: function(trackData) {

      var newRank = this.tracks.length + 1;
      trackData.rank = newRank;
      this.tracks.push(trackData);
    },
    removeTrackFromPlaylist: function(trackId) {

      this.tracks.pull(trackId);
    }
  },
  statics: {
    reorderTracks: function(prevRank, newRank) {

    }
  }
});

module.exports = mongoose.model('Playlist', schema);
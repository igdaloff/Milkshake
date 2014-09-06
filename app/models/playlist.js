var mongoose = require('mongoose')
mongoose.connect('mongodb://127.0.0.1/twm');
var shortId = require('shortid');

var schema = new mongoose.Schema({
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
    duration: Number
  }]
})

module.exports = mongoose.model('Playlist', schema);
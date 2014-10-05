var mongoose = require('mongoose');
var shortId = require('shortid');
var Schema = mongoose.Schema;

var schema = new Schema({
  title: String,
  created: Date,
  playlistId: String,
  messages: [{
    sender: String,
    content: String,
    timestamp: Date,
    playlistTime: String,
    avatar: Object
  }]
});

module.exports = mongoose.model('Conversation', schema);
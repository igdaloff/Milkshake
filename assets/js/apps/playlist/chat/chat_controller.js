TWM.module('Playlist.Chat', function(Chat, TWM, Backbone, Marionette, $, _){

  var isTyping = false;
  var docTitle = document.title;
  var notifierInterval;

  Chat.Controller = {
    displayNewMessage: function(messageData) {

      var messageCollection = TWM.request("chat:messageCollection");
      var socket = TWM.request("playlist:activeSocket");
      if(messageData.sender !== socket.id) {
        messageData['remote'] = true;
        messageCollection.add(messageData);
      }
    },
    sendNewMessage: function(content) {

      // Create a new message model by adding some data to the message collection
      var messageCollection = TWM.request("chat:messageCollection");
      var playlist = TWM.request('playlist:activePlaylistMgr');
      var playlistTime = playlist.getCurrentTotalTimeString();
      var messageModel = messageCollection.add({
        content: content,
        playlistTime: playlistTime
      });
      // Get the currently active socket object
      var socket = TWM.request("playlist:activeSocket");
      socket.emit("newMessage", messageModel);
      Chat.Controller.userIsNotTyping();
    },
    userIsTyping: function() {
      
      var socket = TWM.request("playlist:activeSocket");
      if(!isTyping) {
        socket.emit("userTyping");
      }
      isTyping = true;
    },
    userIsNotTyping: function() {

      var socket = TWM.request("playlist:activeSocket");
      if(isTyping) {
        socket.emit("userNotTyping");
      }
      isTyping = false;
    },
    remoteUserTyping: function(data) {

      var socket = TWM.request("playlist:activeSocket");
      if(data.sender !== socket.id) {
        TWM.trigger("chat:remoteUserTyping");
      }
    },
    remoteUserNotTyping: function(data) {

      var socket = TWM.request("playlist:activeSocket");
      if(data.sender !== socket.id) {
        TWM.trigger("chat:remoteUserNotTyping");
      }
    },
    startNotifier: function() {

      // Flash the <title> every three seconds
      window.clearInterval(notifierInterval);
      notifierInterval = window.setInterval(function() {

        document.title = (document.title === docTitle) ? "New message" : docTitle;
      }, 3000);
    },
    stopNotifier: function() {

      // Reset the title and kill the interval
      document.title = docTitle;
      window.clearInterval(notifierInterval);
    }
  }  
});
TWM.module('Playlist.Chat', function(Chat, TWM, Backbone, Marionette, $, _){

  var isTyping = false;
  Chat.Controller = {
    displayNewMessage: function(data) {

      var messageCollection = TWM.request("chat:messageCollection");
      var socket = TWM.request("playlist:activeSocket");
      if(data.sender !== socket.id) {
        data.remote = true;
      }
      messageCollection.add(data);
    },
    sendNewMessage: function(content) {

      // Get the currently active socket object
      var socket = TWM.request("playlist:activeSocket");
      socket.emit("newMessage", content);
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
    }
  }  
});
TWM.module('Playlist.Chat', function(Chat, TWM, Backbone, Marionette, $, _){

  Chat.Controller = {
    displayNewMessage: function(data) {

      console.log(data);
      var messageCollection = TWM.request("chat:messageCollection");
      messageCollection.add(data);
    },
    sendNewMessage: function(content) {

      // Get the currently active socket object
      var socket = TWM.request("playlist:activeSocket");
      socket.emit("newMessage", content);
    }
  }  
});
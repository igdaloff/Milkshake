TWM.module('Playlist.Chat', function(Chat, TWM, Backbone, Marionette, $, _){

  // prevent starting with parent
  this.startWithParent = false;

  // Declare a region to display our messages in
  var messagesRegion = new Marionette.Region({
    el: ".messages"
  });

  Chat.on("start", function() {

    // Get the currently active socket object
    var socket = TWM.request("playlist:activeSocket");

    // Create a new message collection
    var messageCollection = TWM.request("newMessageCollection:entities");

    var messageList = new Chat.ChatContainer({
      collection: messageCollection
    });

    messagesRegion.show(messageList);

    // Set up a handler to get the message collection
    TWM.reqres.setHandler("chat:messageCollection", function() {

      return messageCollection;
    })

    // When a new message is received
    socket.on("newMessage", Chat.Controller.displayNewMessage);
  })
});
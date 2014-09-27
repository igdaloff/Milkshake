TWM.module('Playlist.Chat', function(Chat, TWM, Backbone, Marionette, $, _){

  // prevent starting with parent
  this.startWithParent = false;

  // Declare a region to display our messages in
  var messagesRegion = new Marionette.Region({
    el: ".messages"
  });

  Chat.on("start", function() {

    var messages = bootstrap.messages || [];
    // Get the currently active socket object
    var socket = TWM.request("playlist:activeSocket");

    // Create a new message collection
    var messageCollection = TWM.request("newMessageCollection:entities", messages);

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
    // When a user typing notification is received
    socket.on("userTyping", Chat.Controller.remoteUserTyping);
    // When a user not typing notification is received
    socket.on("userNotTyping", Chat.Controller.remoteUserNotTyping);
    // If the remote user disconnects
    socket.on("userLeft", function() {

      TWM.trigger("chat:remoteUserNotTyping");
    });
  })
});
TWM.module('Playlist.Chat', function(Chat, TWM, Backbone, Marionette, $, _){

  // prevent starting with parent
  this.startWithParent = false;
  var messagesRegion;

  Chat.on('before:start', function() {
    // Declare a region to display our messages in
    messagesRegion = new Marionette.Region({
      el: '.messages-container'
    });
  });

  var bindSocketEvents = function(socket) {

    // When a new message is received
    socket.on('newMessage', Chat.Controller.displayNewMessage);
    // When a user typing notification is received
    socket.on('userTyping', Chat.Controller.remoteUserTyping);
    // When a user not typing notification is received
    socket.on('userNotTyping', Chat.Controller.remoteUserNotTyping);
    // When the remote user disconnects
    socket.on('userLeft', Chat.Controller.remoteUserDisconnected);
    // When the remote user re-connects
    socket.on('userJoined', Chat.Controller.remoteUserConnected);
    // A new track was added
    socket.on('newTrack', Chat.Controller.newTrackAdded);
    // A track was removed
    socket.on('deleteTrack', Chat.Controller.trackDeleted);
  };

  var bindPlaylistEvents = function(playlistManager) {

    // When a new track starts
    $(playlistManager).on('track:playing', Chat.Controller.newTrackMessage);
  };

  Chat.on('start', function() {

    var messages = bootstrap.messages || [];
    // Get the currently active socket object
    var socket = TWM.request('playlist:activeSocket');
    // Bind socket events to the controller
    bindSocketEvents(socket);

    // Create a new message collection
    var messageCollection = TWM.request('newMessageCollection:entities', messages);

    // Create a chat container view with the messages collection
    var messageList = new Chat.ChatContainer({
      collection: messageCollection
    });

    // Display the chat container view in the messages region
    messagesRegion.show(messageList);

    // Set up a handler to get the message collection
    TWM.reqres.setHandler('chat:messageCollection', function() {

      return messageCollection;
    });

    // Request the active playlist manager from the parent module so we can listen to events
    var playlistManager = TWM.request('playlist:activePlaylistMgr');
    if(typeof playlistManager !== 'undefined') {

      bindPlaylistEvents(playlistManager);
    }
  });
});
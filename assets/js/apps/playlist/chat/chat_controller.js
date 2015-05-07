TWM.module('Playlist.Chat', function(Chat, TWM, Backbone, Marionette, $, _){

  var isTyping = false;
  var notifierInterval = false;
  Chat.Controller = {
    displayNewMessage: function(messageData) {

      var messageCollection = TWM.request('chat:messageCollection');
      var socket = TWM.request('playlist:activeSocket');
      // Stops messages being displayed twice by being added to the collection again
      if(messageData.sender !== socket.id) {

        messageCollection.add(messageData);
      }
    },
    displayNewLogMessage: function(messageContent) {

      // Log a message as long as the playlist has started or 2 users are connected
      var playlistStarted = TWM.request('playlist:isPlaying');
      var playlistModel = TWM.request('playlist:activePlaylistModel');
      if(playlistStarted || playlistModel.get('usersConnected') > 1) {

        var messageCollection = TWM.request('chat:messageCollection');
        messageCollection.add({
          type: 'log',
          content: messageContent
        });
      }
    },
    sendNewMessage: function(content) {

      // Get the currently active socket object
      var socket = TWM.request('playlist:activeSocket');
      // Create a new message model by adding some data to the message collection
      var messageCollection = TWM.request('chat:messageCollection');
      var messageModel = messageCollection.add({
        type: 'chat',
        content: content,
        remote: false,
        sender: socket.id
      });
      socket.emit('newMessage', messageModel);
      Chat.Controller.userIsNotTyping();
    },
    userIsTyping: function() {

      var socket = TWM.request('playlist:activeSocket');
      var messageCollection = TWM.request('chat:messageCollection');
      if(!isTyping) {
        var data = {
          type: 'inbound',
          remote: false,
          content: "...",
          sender: socket.id,
          avatar: messageCollection.avatar
        };
        socket.emit('userTyping', data);
      }
      isTyping = true;
    },
    userIsNotTyping: function() {

      var socket = TWM.request('playlist:activeSocket');
      if(isTyping) {
        socket.emit('userNotTyping');
      }
      isTyping = false;
    },
    remoteUserTyping: function(data) {

      var socket = TWM.request('playlist:activeSocket');
      var messageCollection = TWM.request('chat:messageCollection');
      if(data.sender !== socket.id) {

        messageCollection.add(data);
        TWM.trigger('chat:remoteUserTyping');
      }
    },
    remoteUserNotTyping: function(data) {

      var socket = TWM.request('playlist:activeSocket');
      var messageCollection = TWM.request('chat:messageCollection');
      if(data.sender !== socket.id) {

        var inboundMessage = messageCollection.findWhere({
          type: 'inbound'
        });
        messageCollection.remove(inboundMessage);
        TWM.trigger('chat:remoteUserNotTyping');
      }
    },
    /**
     * Start notifier
     * Flash the document.title every n seconds and immediately once the method is called
     * Don't start if the window is already focused
     */
    startNotifier: function() {

      var playlistTitle = TWM.request('playlist:activePlaylistModel').get('title');
      var docTitle = playlistTitle + ' - Milkshake';
      function toggleTitle() {

        document.title = (document.title === docTitle) ? '͡° ͜ʖ ͡° _/ New message!' : docTitle;
      }
      toggleTitle();

      if(!document.hasFocus()) {

        window.clearInterval(notifierInterval);
        notifierInterval = window.setInterval(toggleTitle, 2000);
      }
    },
    stopNotifier: function() {

      // Reset the title and kill the interval
      if(notifierInterval !== false) {
       
        var playlistTitle = TWM.request('playlist:activePlaylistModel').get('title');
        docTitle = playlistTitle + ' - Milkshake';
        document.title = docTitle;
        window.clearInterval(notifierInterval);
        notifierInterval = false;
      }
    },
    remoteUserDisconnected: function(numUsersInRoom) {

      // Perform no action if there are already two or more people in the room
      if(numUsersInRoom > 1) {

        return false;
      }

      // Cancel the user typing sign
      TWM.trigger('chat:remoteUserNotTyping');
      // Add a disconnected message to the collection
      var messageCollection = TWM.request('chat:messageCollection');
      messageCollection.add({
        type: 'log',
        content: 'Your friend has disconnected'
      });
      // Add a disconnected class to the body
      $('body').addClass('remote-user-disconnected');
    },
    remoteUserConnected: function(numUsersInRoom) {

      // Perform no action if there are already two people in the room
      if(numUsersInRoom > 2) {

        return false;
      }

      // Add a connected message to the collection
      var messageCollection = TWM.request('chat:messageCollection');
      messageCollection.add({
        type: 'log',
        content: 'Your friend has connected'
      });
      // Remove disconnected class from the body
      $('body').removeClass('remote-user-disconnected');
    },
    /*
     * New track message
     * Display a log message when a track starts playing
     */
    newTrackMessage: function(event) {

      var trackData = event.target.getCurrentTrackData();
      Chat.Controller.displayNewLogMessage('Now playing: \'' + trackData.title + '\'');
    },
    newTrackAdded: function(newTrackData) {
      
      Chat.Controller.displayNewLogMessage('\'' + newTrackData.title + '\' was added to the playlist');
    },
    trackDeleted: function(deletedTrackData) {
      
      Chat.Controller.displayNewLogMessage('\'' + deletedTrackData.title + '\' was removed from the playlist');
    },
    renamePlaylist: function(newTitle) {
      
      Chat.Controller.displayNewLogMessage('The room was renamed to \'' + newTitle + '\'');
    },
    playbackErrorMessage: function() {

      var messageCollection = TWM.request('chat:messageCollection');
      messageCollection.add({
        type: 'error',
        content: 'Oops, looks like there was a problem loading the next track. Please refresh the page.'
      });
    }
  };
});
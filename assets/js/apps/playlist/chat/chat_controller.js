TWM.module('Playlist.Chat', function(Chat, TWM, Backbone, Marionette, $, _){

  var isTyping = false;
  var docTitle = document.title;
  var notifierInterval;

  Chat.Controller = {
    displayNewMessage: function(messageData) {

      var messageCollection = TWM.request('chat:messageCollection');
      var socket = TWM.request('playlist:activeSocket');
      // Stops messages being displayed twice by being added to the collection again
      if(messageData.sender !== socket.id) {

        messageCollection.add(messageData);
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
      if(!isTyping) {
        socket.emit('userTyping');
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
      if(data.sender !== socket.id) {
        TWM.trigger('chat:remoteUserTyping');
      }
    },
    remoteUserNotTyping: function(data) {

      var socket = TWM.request('playlist:activeSocket');
      if(data.sender !== socket.id) {
        TWM.trigger('chat:remoteUserNotTyping');
      }
    },
    /**
     * Start notifier
     * Flash the document.title every n seconds and immediately once the method is called
     */
    startNotifier: function() {

      function toggleTitle() {

        document.title = (document.title === docTitle) ? '͡° ͜ʖ ͡° _/ New message!' : docTitle;
      }
      toggleTitle();
      
      window.clearInterval(notifierInterval);
      notifierInterval = window.setInterval(toggleTitle, 2000);

    },
    stopNotifier: function() {

      // Reset the title and kill the interval
      document.title = docTitle;
      window.clearInterval(notifierInterval);
    },
    remoteUserDisconnected: function() {

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
    remoteUserConnected: function() {

      // Add a connected message to the collection
      var messageCollection = TWM.request('chat:messageCollection');
      messageCollection.add({
        type: 'log',
        content: 'Your friend has connected'
      });
      // Remove disconnected class from the body
      $('body').removeClass('remote-user-disconnected');
    }
  }
});
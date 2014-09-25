TWM.module('Playlist.Chat', function(Chat, TWM, Backbone, Marionette, $, _){

  Chat.MessageItem = Marionette.ItemView.extend({
    template: "chat-message",
    tagName: "li",
    className: "chat-message",
    initialize: function() {

      // Save a human-readable version of the timestamp to the model
      var dateObj = new Date(this.model.get("timestamp"));
      var dateStr = dateObj.getHours() + ":";
      if(dateObj.getMinutes().toString().length < 2) {
        dateStr += "0";
      }
      dateStr += dateObj.getMinutes() + ":" + dateObj.getSeconds();
      this.model.set("when", dateStr);
    },
    onRender: function() {

      // If the message is from the other user, add a class to the el
      if(this.model.get("remote")) {

        this.$el.addClass("remote");
      }
    },
    onShow: function() {

      //Keep scroll position at bottom after each message is sent
      var messageContainer = this.el.parentNode;
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
  });

  Chat.ChatContainer = Marionette.CompositeView.extend({
    template: "chat-container",
    childView: Chat.MessageItem,
    childViewContainer: ".message-list",
    events: {
      "keyup .new-message-field": "isUserTyping",
      "keydown .new-message-field": "sendOnEnter",
      "click .new-message-button": "onClickSend"
    },
    initialize: function() {

      // Create a model that will contain the avatar information for passing into the template
      this.model = new Backbone.Model({
        avatar: this.collection.avatar
      });
      this.listenTo(TWM, "chat:remoteUserTyping", this.remoteUserTyping);
      this.listenTo(TWM, "chat:remoteUserNotTyping", this.remoteUserNotTyping);
      this.listenTo(this.collection, "add", function(model) {

        // When a new message is received, check it's remote and if the input field is blurred, start the notifier
        if(model.get("remote") && !$(".new-message-field").is(":focus")) {

          Chat.Controller.startNotifier();
        }
      });
      // Stop the notifier when the window is focused
      $(window).on('focus', Chat.Controller.stopNotifier);
    },
    isUserTyping: function(e) {

      var content = $(e.currentTarget).val();
      if(content.trim().length === 0) {

        Chat.Controller.userIsNotTyping();
      }
      else {

        Chat.Controller.userIsTyping();
      }
    },
    sendOnEnter: function(e) {

      // If enter key was pressed, send the message
      if(e.which === 13) {

        e.preventDefault();
        this.sendMessage();
      }
    },
    onClickSend: function(e) {

      e.preventDefault();
      this.sendMessage();
    },
    sendMessage: function() {

      var $newMessageField = $('.new-message-field');
      var content = $newMessageField.val();
      if(content.trim().length > 0) {
        
        Chat.Controller.sendNewMessage($newMessageField.val());
        $newMessageField.val("").focus();
      }
    },
    remoteUserTyping: function() {

      this.$el.addClass("incoming");
    },
    remoteUserNotTyping: function() {

      this.$el.removeClass("incoming");
    }
  });
});
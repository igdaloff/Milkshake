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
    }
  });

  Chat.ChatContainer = Marionette.CompositeView.extend({
    template: "chat-container",
    itemView: Chat.MessageItem,
    itemViewContainer: ".message-list",
    events: {
      "keyup .new-message-field": "onKeyup"
    },
    initialize: function() {

      this.listenTo(TWM, "chat:remoteUserTyping", this.remoteUserTyping);
      this.listenTo(TWM, "chat:remoteUserNotTyping", this.remoteUserNotTyping);
    },
    onKeyup: function(e) {

      var content = $(e.currentTarget).val();
      if(content.trim().length === 0) {

        Chat.Controller.userIsNotTyping();
      }
      else {
        // If enter key was pressed, send the message
        if(e.which === 13) {

          e.preventDefault();
          Chat.Controller.sendNewMessage(content);
          $(e.currentTarget).val("");
        }
        else {

          Chat.Controller.userIsTyping();
        }
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
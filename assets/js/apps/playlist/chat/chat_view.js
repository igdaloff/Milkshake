TWM.module('Playlist.Chat', function(Chat, TWM, Backbone, Marionette, $, _){

  Chat.MessageItem = Marionette.ItemView.extend({
    template: "chat-message",
    tagName: "li",
    className: "chat-message"
  });

  Chat.ChatContainer = Marionette.CompositeView.extend({
    template: "chat-container",
    itemView: Chat.MessageItem,
    itemViewContainer: ".message-list",
    events: {
      "keydown .new-message-field": "onKeydown"
    },
    initialize: function() {

      console.log(this.collection);
    },
    onKeydown: function(e) {

      // If enter key was pressed, send the message
      if(e.which === 13) {

        e.preventDefault();
        var content = $(e.currentTarget).val();
        if(content.length > 0) {
          
          Chat.Controller.sendNewMessage(content)
        }
        $(e.currentTarget).val("");
      }
    }
  });
});
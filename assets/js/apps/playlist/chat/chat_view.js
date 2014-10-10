TWM.module('Playlist.Chat', function(Chat, TWM, Backbone, Marionette, $, _){

  Chat.ChatItem = Marionette.ItemView.extend({
    template: 'chat-message',
    tagName: 'li',
    className: 'chat-message',
    initialize: function() {

      // Save a human-readable version of the timestamp to the model
      var dateObj = new Date(this.model.get('timestamp'));
      var dateStr = dateObj.getHours() + ':';
      if(dateObj.getMinutes().toString().length < 2) {
        dateStr += '0';
      }
      dateStr += dateObj.getMinutes() + ':' + dateObj.getSeconds();
      this.model.set('when', dateStr);
    },
    onRender: function() {

      var _this = this;

      // If the message is from the other user, add a class to the el
      if(this.model.get('remote')) {

        this.$el.addClass('remote');
      }

      // If this as incoming message, animate the dots
      if(this.model.get('type') === 'inbound') {

        var animate = window.setInterval(function() {

          var newContent;
          var content = _this.$('.chat-message-content').text();
          if(content === '...') {

            newContent = '.';
          }
          else {

            newContent = content + '.';
          }
          _this.$('.chat-message-content').text(newContent);
        }, 500);

        // Stop the animation interval when this view is destroyed
        this.listenTo(this, 'destroy', function() {

          window.clearTimeout(animate);
        });
      }
    },
    onShow: function() {

      this.trigger('show');
      // Ordering of these is important
      this.parseLinks();
      this.parseNewLines();
    },
    parseLinks: function() {

      var chatText = this.model.get('content');
      var linkedChatText = Autolinker.link( chatText, { className: 'chat-message-link' } );
      this.$('.chat-message-content').html(linkedChatText);
    },
    parseNewLines: function() {

      var $content = this.$('.chat-message-content');
      $content.html($content.text().replace(/(?:\r\n|\r|\n)/g, '<br>'));
    }
  });

  Chat.LogItem = Marionette.ItemView.extend({
    template: 'log-message',
    tagName: 'li',
    className: 'log-message'
  });

  Chat.ChatContainer = Marionette.CompositeView.extend({
    template: 'chat-container',
    getChildView: function(item) {

      // Return a message item if this is a chat message, a log item if it is of type 'log'
      if(item.get('type') === 'log') {
        return Chat.LogItem;
      }
      else {
        return Chat.ChatItem;
      }
    },
    childViewContainer: '.message-list',
    events: {
      'keyup .new-message-field': 'isUserTyping',
      'keydown .new-message-field': 'sendOnEnter',
      'click .new-message-button': 'onClickSend'
    },
    childEvents: function() {
      return {
        show: this.onChildShow
      };
    },
    onChildShow: function() {

      this.scrollChatToBottom();
    },
    scrollChatToBottom: function(){

      //Keep scroll position at bottom after each message is sent
      var messageContainer = this.$('.message-list')[0];
      messageContainer.scrollTop = messageContainer.scrollHeight;
    },
    initialize: function() {

      // Create a model that will contain the avatar information for passing into the template
      this.model = new Backbone.Model({
        avatar: this.collection.avatar
      });
      this.listenTo(TWM, 'chat:remoteUserTyping', this.remoteUserTyping);
      this.listenTo(TWM, 'chat:remoteUserNotTyping', this.remoteUserNotTyping);
      this.listenTo(this.collection, 'add', function(model) {

        // When a new message is received, check it's remote and if the input field is blurred, start the notifier
        if(model.get('remote') && !$('.new-message-field').is(':focus') && model.get('type') === 'chat') {

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

      // If enter key was pressed and shift key is not pressed, send the message
      if(e.which === 13 && !e.shiftKey) {

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
        $newMessageField.val('').focus();
      }

      this.removePlaceholder();
    },
    remoteUserTyping: function() {

      this.$el.addClass('incoming');
    },
    remoteUserNotTyping: function() {

      this.$el.removeClass('incoming');
    },
    removePlaceholder: function(){
      var $newMessageField = $('.new-message-field');
      $newMessageField.attr('placeholder', '');
    }
  });
});
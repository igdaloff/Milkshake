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
      // Parse image URLs to HTML
      this.parseImages();
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

      // Add '.chat-active' class as soon as first chat is sent
      if(!$('.chat-active').length){
        $('.messages-container').addClass('chat-active');
      }
    },
    onShow: function() {

      this.trigger('show');
      // Ordering of these is important
      this.parseNewLines();
      this.parseLinks();
      this.scrollOnImageLoad();
    },
    parseLinks: function() {

      var chatText = this.model.get('content');
      var linkedChatText = Autolinker.link( chatText, { className: 'chat-message-link' } );
      this.$('.chat-message-content').html(linkedChatText);
    },
    parseNewLines: function() {

      var $content = this.$('.chat-message-content');
      $content.html($content.html().replace(/(?:\r\n|\r|\n)/g, '<br>'));
    },
    parseImages: function() {

      var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
      var imageUrlRegex = /\.(?:jpe?g|gif|png)$/i;
      var contentArr = this.model.get('content').split(' ');
      var imageHtml = '';
      for(var i = 0; i < contentArr.length; i++) {

        var word = contentArr[i];
        // If the word is an image, add it as a tag at the end of the content (and stop looking for more images)
        if(urlRegex.test(word) && imageUrlRegex.test(word)) {

          imageHtml += ' <img src="' + word + '">';
          break;
        }
      }
      this.model.set('content', this.model.get('content') + imageHtml);
    },
    scrollOnImageLoad: function() {

      // If the new message contains an image, trigger a loaded event once it's loaded so the parent view scrolls again
      var $messageImage = this.$el.find('.chat-message-content img');
      if($messageImage.length) {

        var _this = this;
        $messageImage.one('load', function() {

          _this.trigger('imageLoaded');
        });
      }
    }
  });

  Chat.LogItem = Marionette.ItemView.extend({
    template: 'log-message',
    tagName: 'li',
    className: 'log-message'
  });

  Chat.ErrorLogItem = Chat.LogItem.extend({
    className: 'error-message'
  });

  Chat.ChatContainer = Marionette.CompositeView.extend({
    template: 'chat-container',
    className: 'messages',
    getChildView: function(item) {

      // Return a message item if this is a chat message, a log item if it is of type 'log'
      if(item.get('type') === 'log') {
        return Chat.LogItem;
      }
      if(item.get('type') === 'error') {
        return Chat.ErrorLogItem;
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
    onShow: function() {

      //Scrollbar for chat window that doesn't have defined height
      $('.messages-inner').perfectScrollbar({
        includePadding: true,
        suppressScrollX: true
      });
    },
    onBeforeAddChild: function(childView) {

      // If we're fully scrolled to within n px of the bottom (tolerance), jump to the bottom of the new message when it shows
      if(this.chatViewportIsFullyScrolled()) {

        this.listenTo(childView, 'show destroy imageLoaded', this.scrollChatToBottom);
      }
    },
    scrollChatToBottom: function(){

      //Keep scroll position at bottom after each message is sent
      var messageContainer = this.$('.messages-inner')[0];
      messageContainer.scrollTop = messageContainer.scrollHeight;
    },
    chatViewportIsFullyScrolled: function() {

      var messageContainer = this.$('.messages-inner')[0];
      var tolerance = 50;
      return $(messageContainer).outerHeight() + messageContainer.scrollTop >= messageContainer.scrollHeight - tolerance;
    },
    initialize: function() {

      // Create a model that will contain the avatar information for passing into the template
      this.model = new Backbone.Model({
        avatar: this.collection.avatar
      });
      this.listenTo(TWM, 'chat:remoteUserTyping', this.remoteUserTyping);
      this.listenTo(TWM, 'chat:remoteUserNotTyping', this.remoteUserNotTyping);
      this.listenTo(this.collection, 'add', function(model) {

        // When a new message is received, check it's remote and if the window is blurred, start the notifier
        if(model.get('remote') && !$(window).is(':focus') && model.get('type') === 'chat') {

          Chat.Controller.startNotifier();
          // Stop the notifier when the window is focused, or any other action is performed
          $(window).on('focus.notifier click.notifier keyup.notifier keydown.notifier', function() {

            Chat.Controller.stopNotifier();
            $(window).off('focus.notifier click.notifier keyup.notifier keydown.notifier');
          });
        }
      });
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
      var cleanString = this.sanitizeInput(content);
      if(content.trim().length > 0) {

        Chat.Controller.sendNewMessage(cleanString);
        $newMessageField.val('').focus();
      }

      this.scrollChatToBottom();
      this.removePlaceholder();
    },
    /**
     * Sanitize input
     * Take a string, pass it into a DOM element and get it back out to ensure it ends up as a string, not tags
     * @param input - the string to be sanitize
     * @return cleaned - the sanitized string
     */
    sanitizeInput: function(input) {

      $cleaner = $('<div/>').addClass('cleaner');
      $cleaner.text(input);
      var cleaned = $cleaner.html();
      return cleaned;
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
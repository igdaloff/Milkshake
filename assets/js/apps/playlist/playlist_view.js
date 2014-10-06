TWM.module('Playlist', function(Playlist, TWM, Backbone, Marionette, $, _){

  Playlist.Controls = Marionette.ItemView.extend({
    el: '.playlist-controls',
    events: {
      'click .mute-toggle': 'muteToggle'
    },
    muteToggle: function(e) {

      var muted = Playlist.Controller.muteToggle();
      if(muted) {

        $(e.currentTarget).addClass('muted');
      }
      else {

        $(e.currentTarget).removeClass('muted');
      }
    }
  });
});
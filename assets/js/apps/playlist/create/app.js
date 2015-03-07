TWM.module("Playlist.Create", function(Create, TWM, Backbone, Marionette, $, _){

  // prevent starting with parent
  this.startWithParent = false;

  Create.on('start', function() {
    var client = new ZeroClipboard(document.getElementById('copy-playlist-url-btn'));

    $('#playlist-url-form').on('submit', function(e){

      e.preventDefault();
      var playlistForm = this;

      $('.copy-playlist-url-btn').val('Link copied! Now share it with a friend.');

      setTimeout( function () {
        playlistForm.submit();
      }, 2500);
    });
  });
});
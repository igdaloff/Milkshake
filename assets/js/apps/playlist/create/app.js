TWM.module("Playlist.Create", function(Create, TWM, Backbone, Marionette, $, _){

  // prevent starting with parent
  this.startWithParent = false;

  Create.on('start', function() {

    $('#playlist-url-form').on('submit', function(e){
      e.preventDefault();
      var playlistForm = this;

      $('.playlist-create').addClass('new-playlist-loading');
      $('.create-playlist-btn').val('Loading...');

      setTimeout( function () {
        playlistForm.submit();
      }, 1500);
    });
  });
});
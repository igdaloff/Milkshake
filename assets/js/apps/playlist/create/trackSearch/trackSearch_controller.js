TWM.module("Playlist.Create.TrackSearch", function(TrackSearch, TWM, Backbone, Marionette, $, _){

  var playlistManager;

  TrackSearch.Controller = {
    previewTrack: function(trackModel, previewDuration){

      // First, stop any existing previews that are playing
      TrackSearch.Controller.stopTrackPreview(trackModel);

      // Set isPlaying to true
      trackModel.set("isPlaying", true);

      playlistManager = TWM.request('playlistManager:components', {
        tracks: [trackModel.attributes]
      });

      playlistManager.playTrackSnippet(0, 30, 45, function() {

        // On finish, set isPlaying to false
        trackModel.set("isPlaying", false);
      });
    },
    /* 
     * Stop Track Preview
     * To stop any existing previews we will destroy the playlistManager if it was already set up
     */
    stopTrackPreview: function(trackModel){

      if(typeof trackModel !== "undefined") {
        
        // Set isPlaying to false on all models
        trackModel.collection.setAll("isPlaying", false);
      }
      if(typeof playlistManager === "object") {
       
        playlistManager.destroy();
        playlistManager = false;
      }
    },
    addTrack: function(trackModel){

      var trackIndex = $(".playlist-track-select:checked").data("index");
      var fields = ["id", "source", "title", "url", "artwork", "duration"];
      var $el = $("#chosen-track-" + trackIndex);

      for(var i = 0; i < fields.length; i++){
        var field = fields[i];
        var $field = $("#track-" + trackIndex + "-" + field);

        if(trackModel.get(field) && $field.length){
          $field.val(trackModel.get(field));
        }
      }

      $el.find("p").html(trackModel.get("title"));
      $el.addClass("has-track-selection");

      //Load default artwork image if track has no artwork url
      var artworkUrl;
      if( !trackModel.get("artwork") ){
        artworkUrl = "/img/artwork-placehold.jpg";
      } else {
        artworkUrl = trackModel.get("artwork");
      }

      var $artworkImg = $el.find(".artwork img");
      $artworkImg.attr("src", artworkUrl);

      setTimeout(function(){
        if ($artworkImg.width() > $artworkImg.height()){
          $artworkImg.addClass('landscape');
        } else {
          $artworkImg.removeClass('landscape');
        }
      }, 100);


      //Advance track selection to next one
      var $selectedTrack = $('.selected');
      var $nextTrackToSelect = $selectedTrack.next('li');

      $selectedTrack.removeClass('selected');
      $nextTrackToSelect.addClass('selected').find('.playlist-track-select').prop("checked", true);


      //Detect whether all 3 tracks have been selected and show Create Track button
      var trackEmpty = $(".chosen-tracks li").find(".track-info-id").filter(function() {
        return this.value === "";
      });
      if(!trackEmpty.length) {
        $(".playlist-create-title-container").fadeIn();
      }
    }
  }
});
TWM.module("Playlist.Create.TrackSearch", function(TrackSearch, TWM, Backbone, Marionette, $, _){

  var playlistManager;

  TrackSearch.Controller = {
    searchTracks: function(query) {

      resultsCollection = TWM.request("trackSearch:resultsCollection");
      resultsCollection.query = query;
      resultsCollection.fetch({
        reset: true
      });
    },
    previewTrack: function(trackModel){

      var startTime = 30;
      var previewDuration = 15;

      // First, stop any existing previews that are playing
      TrackSearch.Controller.stopTrackPreview(trackModel);

      playlistManager = TWM.request('playlistManager:components', {
        tracks: [trackModel.attributes]
      });

      // Set the preview to be 0:30-0:45, unless the track is too short otherwise start at 0
      startTime = (trackModel.get("duration") > startTime + previewDuration) ? startTime : 0;
      // End time should be 15 seconds later unless track is too short, in which case finish one
      // second before it ends (to give events a chance to fire)
      var endTime = (trackModel.get("duration") > startTime + previewDuration) ? startTime + previewDuration : trackModel.get("duration") - 1;

      playlistManager.playTrackSnippet(0, startTime, endTime, function() {

        // On start playing, set isPlaying to true
        trackModel.set("isPlaying", true);

        // Create a listener to stop the preview if the track is destroyed (eg with a new search) before it finishes
        trackModel.listenToOnce(trackModel.collection, "reset", function() {

          playlistManager.stopAll();
        });

      }, function() {

        // On finish playing, set isPlaying to false
        trackModel.set("isPlaying", false);
        trackModel.stopListening();
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
    addTrack: function(trackModel, event){

      var trackIndex = $(".playlist-track-select:checked").data("index");
      var fields = ["id", "source", "title", "url", "artwork", "duration"];
      var $el = $("#chosen-track-" + trackIndex);
      var $addTrackIcon = $(this).find('.track-search-result-add');

      //Change add track icon to indicate track was added
      $addTrackIcon.addClass('icon-checkmark');

      for(var i = 0; i < fields.length; i++){
        var field = fields[i];
        var $field = $("#track-" + trackIndex + "-" + field);

        if(trackModel.get(field) && $field.length){
          $field.val(trackModel.get(field));
        }
        else {
          $field.val("");
        }
      }

      $el.find("p").html(trackModel.get("title"));
      $el.addClass("has-track-selection");

      //Load default artwork image if track has no artwork url
      var artworkUrl;
      if( !trackModel.get("artwork") ){
        artworkUrl = "/img/artwork-placehold.gif";
      } else {
        artworkUrl = trackModel.get("artwork");
      }

      var $artworkImg = $el.find(".artwork img");
      $artworkImg.attr("src", artworkUrl);

      $artworkImg.removeClass('landscape');
      $artworkImg.hide();

      setTimeout(function(){
        if ($artworkImg.width() > $artworkImg.height()){
          $artworkImg.addClass('landscape');
        }
        $artworkImg.fadeIn();
      }, 50);


      //Advance track selection to next one
      var $selectedTrack = $('.selected');
      var $nextTrackToSelect = $selectedTrack.next('li');

      $selectedTrack.removeClass('selected');
      $nextTrackToSelect.addClass('selected').find('.playlist-track-select').prop("checked", true);


      //Detect whether all 3 tracks have been selected and show Create Track button
      if($(".has-track-selection").length === 3) {

        TrackSearch.Controller.showTitleField();
      }
    },
    showTitleField: function() {

      // Stop any previews from playing
      if(typeof playlistManager !== "undefined") {

        TrackSearch.Controller.stopTrackPreview();
      }
      // Fade out the search container
      $('.track-search-container').fadeOut();
      // Fade in the title container
      $(".playlist-create-title-container").delay(500).fadeIn();
      // Remove selected class from chose tracks
      $(".chosen-tracks li").removeClass("selected");
    }
  };
});
TWM.module("Playlist.Create.TrackSearch", function(TrackSearch, TWM, Backbone, Marionette, $, _){

  TrackSearch.Controller = {
    previewTrack: function(trackModel, previewDuration){

      var trackUrl = trackModel.get("url");
      var trackDuration = trackModel.get("duration");
      // Find the preview start and end times
      var previewStart = 15;
      var previewEnd = Math.round(previewStart + previewDuration);
      // Create an $el to load our popcorn object into, if it doesn't already exist
      if(!$("#preview-embeds").length){
        $("<div></div>").attr("id", "preview-embeds").appendTo("body");
      }
      else{
        // If the $el already exists, empty it
        $("#preview-embeds").html("");
      }
      // Create the popcorn object and disable autoplay
      var pop = Popcorn.smart( "#preview-embeds", trackUrl);
      pop.autoplay(false);
      // Play the track
      if(trackModel.get("source") == "soundcloud") {
        pop.on( "canplaythrough", function( event ) {
          pop.play();
        });
        pop.on( "timeupdate", function( event ) {
          pop.off("timeupdate");
          pop.pause().mute().currentTime(0);
          var scTimeout = window.setTimeout(function(){
            pop.unmute().currentTime(previewStart).play();
          }, 2000);
        });
      }
      else {
        pop.mute();
        pop.play();
        pop.on( "canplayall", function( event ) {
          pop.currentTime(previewStart);
          pop.unmute();
        });
      }
      // Stop the preview at previewEnd
      pop.exec(previewEnd, function(){
        pop.destroy();
      });
      return pop;
    },
    stopTrackPreview: function(popcornObject){

      popcornObject.destroy();
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
TWM.module("Playlist.Create", function(Create, TWM, Backbone, Marionette, $, _){

  var $chosenTrack = $('.chosen-tracks li');

  $chosenTrack.first().addClass('selected');

  $chosenTrack.on('click', function(){
  	$chosenTrack.removeClass('selected');
  	$(this).addClass('selected');
  	$(this).find('.playlist-track-select').prop("checked", true);
  });


  //Edit track
  $(document).on("click", ".has-track-selection *", function(event){
	  var $el = $(event.target).parents("li");
	  var $chosenTrackArtwork = $el.find(".chosen-track-art img");
	  var $chosenTrackTitle = $el.find(".chosen-track-title");
	  var $chosenTrackSelect = $el.find(".playlist-track-select");

	  $el.removeClass("has-track-selection");
	  $chosenTrackArtwork.attr("src", "").hide();
	  $chosenTrackTitle.html("");
	  $chosenTrackSelect.prop("checked", true);

	  $(".playlist-create-title-container").fadeOut();
	  $(".track-search-container").delay(500).fadeIn();
	});

  $('.track-form').on('submit', function() {

    TWM.trigger('create:playlistCreate');
  });

  //Navigate between tracks with arrow keys
  $("body").keydown(function(e) {

    if( !$(".track-search-query").is(":focus") ){
      var $chosenTrack = $(".selected");

      if(e.keyCode == 37) { // left
        if( $chosenTrack.prev("li").length ){
          $chosenTrack.prev("li").addClass("selected");
          $chosenTrack.removeClass("selected");
          $chosenTrack.prev("li").find(".playlist-track-select").prop("checked", true);
        }
      } else if(e.keyCode == 39) { // right
        if( $chosenTrack.next("li").length ){
          $chosenTrack.next("li").addClass("selected");
          $chosenTrack.removeClass("selected");
          $chosenTrack.next("li").find(".playlist-track-select").prop("checked", true);
        }
      }
    }
  });
});
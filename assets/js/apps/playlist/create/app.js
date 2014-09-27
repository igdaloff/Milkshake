TWM.module("Playlist.Create", function(Create, TWM, Backbone, Marionette, $, _){

  var $chosenTrack = $('.chosen-tracks li');

  $chosenTrack.first().addClass('selected');

  $chosenTrack.on('click', function(){
  	$chosenTrack.removeClass('selected');
  	$(this).addClass('selected');
  });


  //Edit track
  $(document).on("click", ".has-track-selection *", function(event){
	  var $el = $(event.target).parents("li");
	  var $chosenTrackArtwork = $el.find(".chosen-track-art img");
	  var $chosenTrackTitle = $el.find(".chosen-track-title");
	  var $chosenTrackSelect = $el.find(".playlist-track-select");

	  $el.removeClass("has-track-selection");
	  $chosenTrackArtwork.attr("src", "");
	  $chosenTrackTitle.html("");
	  $chosenTrackSelect.prop("checked", true);

	  $(".playlist-create-title-container").fadeOut();
	  $(".track-search-container").delay(500).fadeIn();
	});


  //Navigate between tracks with arrow keys
  $("body").keydown(function(e) {
  	var $chosenTrack = $(".selected");

    if(e.keyCode == 37) { // left
    	if( $chosenTrack.prev("li").length ){
    		$chosenTrack.prev("li").addClass("selected");
    		$chosenTrack.removeClass("selected");
    	}
    } else if(e.keyCode == 39) { // right
    	if( $chosenTrack.next("li").length ){
    		$chosenTrack.next("li").addClass("selected");
    		$chosenTrack.removeClass("selected");
    	}
    }
  });
});
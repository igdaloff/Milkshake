TWM.module("Playlist.Create", function(Create, TWM, Backbone, Marionette, $, _){

  var $chosenTrack = $('.chosen-tracks li');

  $chosenTrack.first().addClass('selected');
  $chosenTrack.first().find('.playlist-track-select').attr("checked", true);

  $chosenTrack.on('click', function(){
  	$chosenTrack.removeClass('selected');
  	$(this).addClass('selected');
  	$(this).find('.playlist-track-select').attr("checked", true);
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


  //Navigate between tracks with arrow keys
  $("body").keydown(function(e) {
  	var $chosenTrack = $(".selected");

    if(e.keyCode == 37) { // left
    	if( $chosenTrack.prev("li").length ){
    		$chosenTrack.prev("li").addClass("selected");
    		$chosenTrack.removeClass("selected");
    		$chosenTrack.find('.playlist-track-select').attr("checked", false);
    		$chosenTrack.prev("li").find('.playlist-track-select').attr("checked", true);
    	}
    } else if(e.keyCode == 39) { // right
    	if( $chosenTrack.next("li").length ){
    		$chosenTrack.next("li").addClass("selected");
    		$chosenTrack.removeClass("selected");
    		$chosenTrack.find('.playlist-track-select').attr("checked", false);
    		$chosenTrack.next("li").find('.playlist-track-select').attr("checked", true);
    	}
    }
  });

  //Copy playlist url to clipboard
  var $copyButton = $(".copy-button");
  var client = new ZeroClipboard($copyButton);

  client.on( "ready", function( readyEvent ) {
    console.log( "ZeroClipboard SWF is ready!" );

    var shareUrl = $(".share-link").val();
    $copyButton.attr("data-clipboard-text", shareUrl);

    client.on( "aftercopy", function( event ) {
      // `this` === `client`
      // `event.target` === the element that was clicked
      console.log("Copied text to clipboard: " + event.data["text/plain"] );
      $copyButton.html("Link copied!")
    });
  });
});
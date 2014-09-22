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
	  console.log($el);
	  var $chosenTrackArtwork = $el.find(".chosen-track-art img");
	  var $chosenTrackTitle = $el.find(".chosen-track-title");
	  var $chosenTrackSelect = $el.find(".playlist-track-select");

	  $el.removeClass("has-track-selection");
	  $chosenTrackArtwork.attr("src", "");
	  $chosenTrackTitle.html("");
	  $chosenTrackSelect.prop("checked", true);

	  $('.playlist-create-title-container').fadeOut();
	  $(".track-search-container").delay(500).fadeIn();
	 });
});
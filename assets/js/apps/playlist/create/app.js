TWM.module("Playlist.Create", function(Create, TWM, Backbone, Marionette, $, _){

  var $chosenTrack = $('.chosen-tracks li');

  $chosenTrack.first().addClass('selected');

  $chosenTrack.on('click', function(){
  	$chosenTrack.removeClass('selected');
  	$(this).addClass('selected');
  });
});
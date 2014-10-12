var TWM = new Marionette.Application();

//Detect if user is on mobile; show different content accordingly
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
	$('body').addClass('user-on-mobile');
}
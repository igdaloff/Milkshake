exports.home = function(req, res){

  // Show the splash page if this is Production
  if(true) {

    var images = ['kelis', 'sugarlumps', 'thriller', 'gangnam', 'hammer'];
    var image = images[Math.floor(Math.random() * images.length)];
    res.render('splash', {
      image: image
    });  
  }
  else {
    res.render('new-playlist');
  }
};
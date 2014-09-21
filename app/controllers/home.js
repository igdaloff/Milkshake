exports.home = function(req, res){

  // Show the splash page if this is Production
  if(true) {

    res.render('splash');  
  }
  else {
    res.render('new-playlist');
  }
};
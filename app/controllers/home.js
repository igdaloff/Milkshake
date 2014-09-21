exports.home = function(req, res){

  // Show the splash page if this is Production
  if(process.env.NODE_ENV === "production") {

    res.render('splash');  
  }
  else {
    res.render('new-playlist');
  }
};
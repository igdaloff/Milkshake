var https = require("https");

var Request = function(http_opts, callback_fn){

  var req = https.request(http_opts, function(res){
    res.setEncoding('utf8');
    var data = '';
    res.on('data', function(d) {
      data += d;
    });
    res.on('end', function() {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.log('non-json response');
      }
      callback_fn(data);
    });
  });
  req.end();
}

module.exports = Request;
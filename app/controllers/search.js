exports.searchByString = function(req, res){

  var api = require(config.root + "lib/api.js");
  var url = require("url");
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;

  if(typeof query.q !== 'undefined' && query.q.length) {

    results = api.search({
      query: query.q,
      success: function(data){
        
        res.send(200, data);
      }
    });
  }
  else{
    res.send(500, {
      error: "No search query was provided"
    });
  }
};
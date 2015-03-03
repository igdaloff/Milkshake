var Soundcloud = (function(){

  function soundcloud(opts){

    opts = opts || {};
    this.host = "api.soundcloud.com";
    this.limit = typeof(opts.limit) == "number" ? opts.limit : 50;
    this.client_id = typeof(opts.client_id) == "string" ? opts.client_id : "ce00c34ab0935df23757e77d51e50b8a";
  }

  soundcloud.prototype.makeGet = function(opts){

    var path, params, querystring;
    querystring = require("querystring");

    try{
      path = opts.path
    }
    catch(e){
      console.error("makeGet: path must be defined");
    }

    // Append the client ID to the params
    params = opts.params || {};
    // Append the client ID to the params
    params.client_id = this.client_id;
    // Set the result limit
    params.limit = this.limit;

    var http_opts = {
      method: "GET",
      host: this.host,
      path: "/" + path + ".json" + (typeof(opts.params) != "undefined" ? "?" + querystring.stringify(opts.params) : "")
    }
    return http_opts;
  }

  soundcloud.prototype.parse = function(data){

    var clean_data = [];
    var tracks = data;
    for (key in tracks) {
      
      var track, result = {};
      result.source = "soundcloud";

      // Extract the data we want for the feed
      track = tracks[key];

      if(typeof track !== "undefined") {
        
        result.id = track.id;
        result.url = track.permalink_url;
        result.title = track.title;
        result.duration = track.duration / 1000;
        result.artwork = typeof(track.artwork_url) === "string" ? track.artwork_url.replace("-large.jpg", "-t300x300.jpg") : null;
        result.hits = typeof(track.playback_count === 'number') ? track.playback_count : 0;
        // Push the result to the clean_data array
        clean_data.push(result);
      }
    }
    return clean_data;
  }

  /**
    * Query
    * Queries the Soundcloud track library with a query string
    * @param - req.query - the query string
  */
  soundcloud.prototype.query = function(query, callback_fn){

    var _this = this;
    http_opts = this.makeGet({
      path: "tracks",
      params: {q: query}
    });
    request = require("./request.js");
    // Request the data, then sort it and return it in the callback
    request(http_opts, function(data){

      clean_data = _this.parse(data);
      callback_fn(clean_data);
    });
  }

  soundcloud.prototype.queryByUrl = function(url, callback) {

    var _this = this;
    http_opts = this.makeGet({
      path: "resolve",
      params: {url: url}
    });
    console.log('soundcloud url query:', http_opts);
    request = require("./request.js");
    // Request the data, then sort it and return it in the callback
    request(http_opts, function(data){

      // TODO - check if errors key exists, repalce https with http if data.location is returned
      if(typeof(data.err) !== 'undefined') {

        return callback([]);
      }
        
      // Replace https with http in the location
      var queryUrl = data.location.split('https').join('http');

      request(queryUrl, function(data) {

        clean_data = _this.parse([data]);
        callback(clean_data);
      });
    });
  };

  return soundcloud;
})();

module.exports = Soundcloud;
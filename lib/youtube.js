var googleapis = require("googleapis");

var Youtube = (function(){

  function youtube(opts){

    opts = opts || {};
    this.limit = typeof(opts.limit) == "number" ? opts.limit : 50;
    this.apiKey = typeof(opts.apiKey) == "string" ? opts.apiKey : "AIzaSyDwdE-96BL1ksJUUpKumED4MdlyRelyc_4";
  }

  youtube.prototype.parse = function(videoData){

    var cleanData = [];;
    for (key in videoData) {
      
      var video, result = {};
      result.source = "youtube";

      // Extract the data we want for the feed
      // If any important properties don't exist, continue to the next item in the list
      video = videoData[key];
      if(typeof video !== "undefined") {

        // Get the ID
        if(typeof video.id !== "undefined" && typeof video.id.$t === "string") {
          
          result.id = video.id.$t.split("/videos/")[1];
        }
        else {

          continue;
        }
        // Get the URL
        if(typeof video.link === "object" && video.link.length) {

          result.url = video.link[0].href;
        }
        else {
          continue;
        }
        // Get the title
        if(typeof video.title !== "undefined" && typeof video.title.$t === "string") {
          
          result.title = video.title.$t;
        }
        // Get hits
        if(typeof video.yt$statistics === "object" && typeof video.yt$statistics.viewCount !== "undefined") {

          result.hits = parseInt(video.yt$statistics.viewCount);
        }
        if(typeof video.media$group !== "undefined") {
          
          if(typeof video.media$group.media$content === "object" && video.media$group.media$content.length) {
            
            result.duration = video.media$group.media$content[0].duration;
          }
          else {
            continue;
          }

          if(typeof video.media$group.media$thumbnail === "object" && video.media$group.media$thumbnail.length) {

            result.artwork = video.media$group.media$thumbnail[0].url;
          }
          else {
            continue;
          }
        }

        // Push the result to the cleanData array
        cleanData.push(result);
      }
    }
    return cleanData;
  };

  youtube.prototype.query = function(query, callback){

    var youtubeApi = googleapis.youtube('v3');

    var params = {
      maxResults: this.limit,
      q: query,
      type: 'video',
      part: 'snippet',
      chart: 'mostPopular',
      auth: this.apiKey
    };

    var request = youtubeApi.search.list(params, function(err, response) {

      console.log(response);
      callback(response);
    });
  };


  youtube.prototype.queryByUrl = function(url, callback) {


    // Extract the ID from the URL
    var videoId;
    if(url.indexOf('youtu.be/') !== -1) {

      // Short URL used
      videoId = url.substr(url.lastIndexOf('/') + 1);
    }
    else {
     
     // Video must be in 'v' param 
      videoId = url.substr(url.indexOf('v=') + 2);
    }
    if(videoId.indexOf('&') !== -1) {
      
      videoId = videoId,substr(0, videoId.indexOf('&'));
    }

    var _this = this;
    http_opts = this.makeGet({
      path: '/' + videoId,
      params: {v: 2}
    });
    request = require("./request.js");
    // Request the data, then sort it and return it in the callback

    request(http_opts, function(data){

      if(typeof(data.entry) !== 'object') {

        return callback([]);
      }

      clean_data = _this.parse([data.entry]);
      callback(clean_data);
    });
  };

  return youtube;
})();

module.exports = Youtube;
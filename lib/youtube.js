var request = require('./request');

var Youtube = (function(){

  function youtube(opts){

    opts = opts || {};
    this.limit = typeof(opts.limit) == 'number' ? opts.limit : 50;
    this.apiKey = typeof(opts.apiKey) == 'string' ? opts.apiKey : 'AIzaSyDwdE-96BL1ksJUUpKumED4MdlyRelyc_4';
  }

  youtube.prototype.makeGet = function(path, params){

    var path, params, querystring;
    querystring = require("querystring");

    params = params || {};
    // Append the api key to the params
    params.key = this.apiKey;

    var httpOpts = {
      method: "GET",
      host: 'www.googleapis.com',
      path: "/youtube/v3/" + path + (typeof(params) != "undefined" ? "?" + querystring.stringify(params) : "")
    };
    return httpOpts;
  };

  youtube.prototype.parse = function(videoData, callback){

    var cleanData = [];;
    for (key in videoData) {
      

      var video, result = {};
      result.source = 'youtube';

      // Extract the data we want for the feed
      // If any important properties don't exist, continue to the next item in the list
      video = videoData[key];
      if(typeof video !== 'undefined') {

        // Get the ID
        if(typeof video.id !== 'undefined') {
          
          result.id = video.id.videoId;
          // Get the URL
          result.url = 'https://youtube.com/watch?v=' + video.id.videoId;
        }
        else continue;
        
        // Get the title
        if(typeof video.snippet !== 'undefined' && typeof video.snippet.title === 'string') {
          
          result.title = video.snippet.title;
        }
        else continue;

        // Get the artwork
        if(typeof video.snippet !== 'undefined' && typeof video.snippet.thumbnails !== 'undefined') {
          
          result.artwork = video.snippet.thumbnails.medium.url;
        }
        
        // Get the video durations
        if(typeof video.contentDetails !== 'undefined' && typeof video.contentDetails.duration !== 'undefined') {

          result.duration = this.convertDurationToSeconds(video.contentDetails.duration);

        }

        // Push the result to the cleanData array
        cleanData.push(result);
      }
    }

    return cleanData;
  };

  youtube.prototype.query = function(query, callback){

    var _this = this;

    var httpOpts = this.makeGet('search', {
      part: 'snippet', // Arbitrary but required
      maxResults: this.limit, // Int between 0-50
      q: query, // The search term
      type: 'video', // Not channels or users or anything
      videoCategoryId: 10 // Music
    });

    request(httpOpts, function(response){

      var cleanData;
      if(response !== null) {

        cleanData = _this.parse(response.items);
        callback(cleanData);
      }
      else {

        callback([]);
      }
    });
  };

  youtube.prototype.convertDurationToSeconds = function(duration) {

    // From http://stackoverflow.com/questions/22148885/converting-youtube-data-api-v3-video-duration-format-to-seconds-in-javascript-no
    var a = duration.match(/\d+/g);

    if (duration.indexOf('M') >= 0 && duration.indexOf('H') == -1 && duration.indexOf('S') == -1) {
      a = [0, a[0], 0];
    }

    if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1) {
      a = [a[0], 0, a[1]];
    }
    if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1 && duration.indexOf('S') == -1) {
      a = [a[0], 0, 0];
    }

    duration = 0;

    if (a.length == 3) {
      duration = duration + parseInt(a[0]) * 3600;
      duration = duration + parseInt(a[1]) * 60;
      duration = duration + parseInt(a[2]);
    }

    if (a.length == 2) {
      duration = duration + parseInt(a[0]) * 60;
      duration = duration + parseInt(a[1]);
    }

    if (a.length == 1) {
      duration = duration + parseInt(a[0]);
    }
    return duration;
  }

  youtube.prototype.queryByUrl = function(url, callback) {

    var _this = this;
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

    var httpOpts = this.makeGet('videos', {
      part: 'snippet,contentDetails', // Arbitrary but required
      id: videoId
    });

    request(httpOpts, function(response){

      var cleanData;
      if(response !== null) {

        cleanData = _this.parse(response.items);
        callback(cleanData);
      }
      else {

        callback([]);
      }
    });
  };

  return youtube;
})();

module.exports = Youtube;
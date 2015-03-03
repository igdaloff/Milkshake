API = {

  /**
   * Search
   * Query both the Soundcloud and Youtube APIs, then merge the results and sort the data by relevance based on the query value.
   *
   * @param opts - An object containing the search parameters and callback functions
   * @param opts.query - The string we want to search for
   * @param opts.limit - The maximum number of results to return
   * @param opts.success - Callback function to return on successful query
   */
  search: function(opts){

    var query = typeof(opts.query) == 'string' ? opts.query : null;
    var limit = typeof(opts.limit) == 'number' && opts.limit <= 100 ? opts.limit : 30;
    var success = typeof(opts.success) == 'function' ? opts.success : function(data){  return data; };
    
    // If this is a Soundcloud or Youtube URL, get the track directly from their API
    if(query.indexOf('soundcloud.com') !== -1) {

      fetchSoundcloudTrackFromUrl(query, success);
    }
    else if(query.indexOf('youtube.com') !== -1) {

      fetchYoutubeTrackFromUrl(query, success);
    }
    // Otherwise this is a normal fuzzy search
    else {

      fetchQueryResults(query, limit, success);
    }
  }
}

// PRIVATE METHODS

function fetchSoundcloudTrackFromUrl(url, success) {

  var Soundcloud = require(config.root + 'lib/soundcloud.js');
  var soundcloud = new Soundcloud();

  // Get the data for a track by URL
  soundcloud.queryByUrl(url, success);
}

function fetchYoutubeTrackFromUrl(url, success) {

  var Youtube = require(config.root + 'lib/youtube.js');
  var youtube = new Youtube();
  // Get the data for a track by URL
  youtube.queryByUrl(url, success);
}

function fetchQueryResults(query, limit, success) {

  var _ = require('underscore');
  var relevancy = require('relevancy');
  var Soundcloud = require(config.root + 'lib/soundcloud.js');
  var Youtube = require(config.root + 'lib/youtube.js');

  var soundcloud = new Soundcloud({
    limit: limit / 2
  });
  var youtube = new Youtube({
    limit: limit / 2
  });
  var results = [];
  var youtubeDone = false;
  var soundcloudDone = false;
  var ytResults, scResults;

  // Get results from the Soundcloud API
  soundcloud.query(query, function(data){

    soundcloudDone = true;
    ytResults = data;
    zipResults(success);
  });
  // Get results from the Youtube API
  youtube.query(query, function(data){

    youtubeDone = true;
    scResults = data;
    zipResults(success);
  });

  /**
   * Zip results
   * Zip the youtube and soundcloud results, ensuring the resulting array is flat and contains no null or undefined values
   */
  var zipResults = function(callback) {

    // Wait until we have both sets of results
    if(!youtubeDone || !soundcloudDone){
      return false;
    }
    var zippedResults = _.zip(scResults, ytResults);
    var slicedResults = zippedResults.slice(0, limit);
    // Return a filtered array where we removed all nulls
    var flattened = _.flatten(slicedResults);
    var filtered = flattened.filter(function(i) {

      return typeof i !== 'undefined' && i !== null;
    });
    callback(filtered);
  }
}

module.exports = API;
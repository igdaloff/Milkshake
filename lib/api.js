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

    var _ = require('underscore');
    var Soundcloud = require(config.root + 'lib/soundcloud.js');
    var Youtube = require(config.root + 'lib/youtube.js');

    var query = typeof(opts.query) == 'string' ? opts.query : null;
    var limit = typeof(opts.limit) == 'number' && opts.limit <= 100 ? opts.limit : 30;
    var success = typeof(opts.success) == 'function' ? opts.success : function(data){  return data; };

    var soundcloud = new Soundcloud();
    var youtube = new Youtube();
    var results = new Array();
    var youtubeDone = false;
    var soundcloudDone = false;

    // Get results from the Soundcloud API
    soundcloud.query(query, function(data){

      soundcloudDone = true;
      results = results.concat(data);
      sortResults();
    });
    // Get results from the Youtube API
    youtube.query(query, function(data){

      youtubeDone = true;
      results = results.concat(data);
      sortResults();
    });

    /**
     * 
     * Take the array of combined Youtube and Soundcloud results and sort them using Relevancy
     *
     * @return sortedResults - The sorted array of results from the combined API queries
     */
    var sortResults = function(){

      // Wait until we have both sets of results
      if(!youtubeDone || !soundcloudDone){
        return false;
      }

      var sortedResults = _.sortBy(results, function(result) {

        return -result.hits
      });
      
      // Return only the 20 most relevant results

      var slicedResults = sortedResults.slice(0, limit);
      if(typeof success === 'function') {
       
        success(slicedResults);
      }

      return slicedResults;
    }
  }
}

module.exports = API;
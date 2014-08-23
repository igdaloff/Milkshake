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

    var relevancy = require("relevancy");
    var Soundcloud = require(config.root + "lib/soundcloud.js");
    var Youtube = require(config.root + "lib/youtube.js");

    var query = typeof(opts.query) == "string" ? opts.query : null;
    var limit = typeof(opts.limit) == "number" && opts.limit <= 100 ? opts.limit : 20;
    var success = typeof(opts.success) == "function" ? opts.success : function(data){  return data; };

    var soundcloud = new Soundcloud();
    var youtube = new Youtube();
    var results = new Array();
    var youtube_done = false;
    var soundcloud_done = false;

    // Get results from the Soundcloud API
    soundcloud.query(query, function(data){

      soundcloud_done = true;
      results = results.concat(data);
      sort_results();
    });
    // Get results from the Youtube API
    youtube.query(query, function(data){

      youtube_done = true;
      results = results.concat(data);
      sort_results();
    });

    /**
     * Sort results
     * Take the array of combined Youtube and Soundcloud results and sort them using Relevancy
     *
     * @return sorted_results - The sorted array of results from the combined API queries
     */
    var sort_results = function(){

      // Wait until we have both sets of results
      if(!youtube_done || !soundcloud_done){
        return false;
      }

      var sorter = new relevancy.Sorter();
      var sorted_results = sorter.sort(results, query, function(obj, calc){
        // Only sort by the title
        return calc(obj.title);
      });
      
      // Return only the 20 most relevant results
      success(sorted_results.slice(0, limit));

      return sorted_results;
    }
  }
}

module.exports = API;
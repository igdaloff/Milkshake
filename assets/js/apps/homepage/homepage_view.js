TWM.module('Homepage', function(Homepage, TWM, Backbone, Marionette, $, _){

  Homepage.RecentPlaylist = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'basic-table-row',
    template: 'recent-playlist-row',
    onBeforeRender: function() {

      // Set a default value for last track added in case there are no tracks
      if(typeof(this.model.get('lastTrackAdded')) === 'undefined') {

        this.model.set('lastTrackAdded', '-');
      }

      if(typeof(this.model.get('updated')) !== 'undefined') {

        var d = new Date(this.model.get('updated'));
        var dateString = d.toDateString();
        this.model.set('updatedDateString', dateString);
      }
    }
  });

  Homepage.RecentPlaylists = Marionette.CompositeView.extend({
    tagName: 'table',
    className: 'basic-table',
    template: 'recent-playlist-table',
    childViewContainer: 'tbody',
    childView: Homepage.RecentPlaylist
  });
});
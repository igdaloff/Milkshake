TWM.module("Entities", function(Entities, TWM, Backbone, Marionette, $, _){

  Entities.Message = Backbone.Model.extend({
    defaults: {
      timestamp: new Date().getTime(),
      playlistTime: ""
    },
    initialize: function() {

      // Add the avatar if there isn't one already
      if(typeof this.get("avatar") === "undefined" && typeof this.collection !== "undefined") {

        this.set("avatar", this.collection.avatar);
      }
    }
  });

  Entities.MessageCollection = Backbone.Collection.extend({
    model: Entities.Message,
    initialize: function() {

      this.pickAvatar();
    },
    pickAvatar: function() {

      var artists = [{
        artist: "Cam'ron",
        image: "camron.jpg"
      },
      {
        artist: "David Bowie",
        image: "david-bowie.jpg"
      },
      {
        artist: "Johann Sebastian Bach",
        image: "js-bach.jpg"
      },
      {
        artist: "Lady Gaga",
        image: "lady-gaga.jpg"
      },
      {
        artist: "Michael Jackson",
        image: "michael-jackson.jpg"
      },
      {
        artist: "John Lennon",
        image: "john-lennon.jpg"
      },
      {
        artist: "Daft Punk",
        image: "daft-punk-thomas.jpg"
      },
      {
        artist: "Daft Punk",
        image: "daft-punk-guy-manuel.jpg"
      }];

      var randArtist = Math.floor(Math.random() * artists.length);
      this.avatar = artists[randArtist];
    }
  });

  // Set our req/res handlers

  TWM.reqres.setHandler("newMessageCollection:entities", function(models){ 
    
    return new Entities.MessageCollection(models);
  });
});
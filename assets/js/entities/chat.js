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
      
      this.set("remote", this.isRemote());
    },
    /**
     * Is remote
     * Detect whether the sender of the message is the client by checking in the local storage for saved 
     * socket IDs (ie, check the history of connections from this browser to figure out who sent this message)
     @return bool
     */
    isRemote: function() {

      var socketIds = TWM.request('playlist:socketIdHistory');
      return socketIds.indexOf(this.get("sender")) === -1;
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
      },
      {
        artist: "Donna Summer",
        image: "donna-summer.jpg"
      },
      {
        artist: "Ian Curtis",
        image: "ian-curtis.jpg"
      },
      {
        artist: "Thom Yorke",
        image: "thom-yorke.jpg"
      },
      {
        artist: "Marc Bolan",
        image: "marc-bolan.jpg"
      },
      {
        artist: "The Notorious B.I.G.",
        image: "biggie.jpg"
      },
      {
        artist: "Elvis Presley",
        image: "elvis-presley.jpg"
      },
      {
        artist: "Kelis",
        image: "kelis.jpg"
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
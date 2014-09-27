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
    initialize: function(models) {

      this.pickAvatar();
      // Loop through any models used to initialize the collection and find the right avatar
      for(var i = 0; i < models.length; i++) {

        var model = models[i];
        var socketIds = TWM.request('playlist:socketIdHistory');
        var isRemote = socketIds.indexOf(model.sender) === -1;
        if(!isRemote && model.remote !== true && typeof model.avatar !== "undefined") {

          // Set the avatar on the collection
          this.avatar = model.avatar;
          // Now we've got the avatar we can stop looping
          break;
        }
      };
    },
    pickAvatar: function() {

      var artists = [{
        name: "Cam'ron",
        image: "camron.jpg"
      },
      {
        name: "David Bowie",
        image: "david-bowie.jpg"
      },
      {
        name: "Johann Sebastian Bach",
        image: "js-bach.jpg"
      },
      {
        name: "Lady Gaga",
        image: "lady-gaga.jpg"
      },
      {
        name: "Michael Jackson",
        image: "michael-jackson.jpg"
      },
      {
        name: "John Lennon",
        image: "john-lennon.jpg"
      },
      {
        name: "Johnny Cash",
        image: "johnny-cash.jpg"
      },
      {
        name: "Morrissey",
        image: "morrissey.jpg"
      },
      {
        name: "Andre 3000",
        image: "andre-3000.jpg"
      },
      {
        name: "Bjork",
        image: "bjork.jpg"
      },
      {
        name: "Beck",
        image: "beck.jpg"
      },
      {
        name: "Leonard Cohen",
        image: "leonard-cohen.jpg"
      },
      {
        name: "Donna Summer",
        image: "donna-summer.jpg"
      },
      {
        name: "Ian Curtis",
        image: "ian-curtis.jpg"
      },
      {
        name: "Thom Yorke",
        image: "thom-yorke.jpg"
      },
      {
        name: "Marc Bolan",
        image: "marc-bolan.jpg"
      },
      {
        name: "The Notorious B.I.G.",
        image: "biggie.jpg"
      },
      {
        name: "Elvis Presley",
        image: "elvis-presley.jpg"
      },
      {
        name: "Kelis",
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
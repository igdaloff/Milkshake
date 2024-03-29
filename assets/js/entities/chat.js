TWM.module("Entities", function(Entities, TWM, Backbone, Marionette, $, _){

  Entities.Message = Backbone.Model.extend({
    defaults: {
      timestamp: new Date().getTime(),
      playlistTime: "",
      type: "chat",
    },
    initialize: function() {

      // Add the avatar if there isn't one already
      if(typeof this.get("avatar") === "undefined" && typeof this.collection !== "undefined") {

        this.set("avatar", this.collection.avatar);
      }

      this.set("remote", this.isRemote());
      this.setPlaylistTime();
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
    },
    setPlaylistTime: function() {

      var playlist = TWM.request('playlist:activePlaylistMgr');
      if(typeof playlist !== 'undefined') {

        var playlistTime;
        // If the playlist has finished, use the total time
        if(playlist.finished === true) {

          playlistTime = playlist.getPlaylistDuration();
        }
        else {
          playlistTime = playlist.getCurrentTotalTime();
        }
        var playlistTimeString = TWM.Lib.secondsToMinutes(playlistTime);
        this.set('playlistTime', playlistTimeString);
      }
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
      }
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
      },
      {
        name: "Prince",
        image: "prince.jpg"
      },
      {
        name: "Madonna",
        image: "madonna.jpg"
      },
      {
        name: "David Byrne",
        image: "david-byrne.jpg"
      },
      {
        name: "Wolfgang Amadeus Mozart",
        image: "mozart.jpg"
      },
      {
        name: "Ludwig van Beethoven",
        image: "beethoven.jpg"
      },
      {
        name: "Franz List",
        image: "liszt.jpg"
      },
      {
        name: "Murdoc",
        image: "gorillaz-murdoc.jpg"
      },
      {
        name: "Billie Holiday",
        image: "billie-holiday.jpg"
      },
      {
        name: "Miles Davis",
        image: "miles-davis.jpg"
      },
      {
        name: "Katy Perry",
        image: "katy-perry.jpg"
      },
      {
        name: "Rhianna",
        image: "rhianna.jpg"
      },
      {
        name: "Missy Elliott",
        image: "missy-elliott.jpg"
      },
      {
        name: "Jay Z",
        image: "jay-z.jpg"
      },
      {
        name: "Beyonce",
        image: "beyonce-knowles.jpg"
      },
      {
        name: "Gwen Stefani",
        image: "gwen-stefani.jpg"
      },
      {
        name: "George Clinton",
        image: "george-clinton.jpg"
      },
      {
        name: "Buddy Holly",
        image: "buddy-holly.jpg"
      },
      {
        name: "Kurt Cobain",
        image: "kurt-cobain.jpg"
      },
      {
        name: "Elton John",
        image: "elton-john.jpg"
      },
      {
        name: "Stevie Wonder",
        image: "stevie-wonder.jpg"
      },
      {
        name: "Adam Levine",
        image: "adam-levine.jpg"
      },
      {
        name: "Sam Smith",
        image: "sam-smith.jpg"
      },
      {
        name: "Kelly Clarkson",
        image: "kelly-clarkson.jpg"
      },
      {
        name: "Usher",
        image: "usher.jpg"
      },
      {
        name: "Drake",
        image: "drake.jpg"
      },
      {
        name: "Dr. Dre",
        image: "dr-dre.jpg"
      },
      {
        name: "Blake Shelton",
        image: "blake-shelton.jpg"
      },
      {
        name: "Aretha Franklin",
        image: "aretha-franklin.jpg"
      },
      {
        name: "Jimi Hendrix",
        image: "jimi-hendrix.jpg"
      },
      {
        name: "Nick Jonas",
        image: "nick-jonas.jpg"
      },
      {
        name: "Snoop Dogg",
        image: "snoop-dogg.jpg"
      },
      {
        name: "Bob Marley",
        image: "bob-marley.jpg"
      },
      {
        name: "Joey Ramone",
        image: "joey-ramone.jpg"
      },
      {
        name: "Kanye West",
        image: "kanye-west.jpg"
      },
      {
        name: "Dizzee Rascal",
        image: "dizzee-rascal.jpg"
      },
      {
        name: "Annie Lennox",
        image: "annie-lennox.jpg"
      },
      {
        name: "BB King",
        image: "bb-king.jpg"
      },
      {
        name: "Damon Albarn",
        image: "damon-albarn.jpg"
      },
      {
        name: "Four Tet",
        image: "four-tet.jpg"
      },
      {
        name: "Jack Black",
        image: "jack-black.jpg"
      },
      {
        name: "Jack White",
        image: "jack-white.jpg"
      },
      {
        name: "Sting",
        image: "sting.jpg"
      },
      {
        name: "Tricky",
        image: "tricky.jpg"
      }
      ];

      var randArtist = Math.floor(Math.random() * artists.length);
      this.avatar = artists[randArtist];
    }
  });

  // Set our req/res handlers

  TWM.reqres.setHandler("newMessageCollection:entities", function(models){

    return new Entities.MessageCollection(models);
  });
});
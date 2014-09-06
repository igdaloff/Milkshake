TWM.module("Entities", function(Entities, TWM, Backbone, Marionette, $, _){

  Entities.Message = Backbone.Model.extend({
    defaults: {
      timestamp: new Date().getTime()
    }
  });

  Entities.MessageCollection = Backbone.Collection.extend({
    model: Entities.Message
  });

  // Set our req/res handlers

  TWM.reqres.setHandler("newMessageCollection:entities", function(models){ 
    
    return new Entities.MessageCollection(models);
  });
});
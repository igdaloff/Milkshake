Backbone.Collection.prototype.setAll = function(key, value) {

  _.each(this.models, function(model) {

    model.set(key, value);
  });
};
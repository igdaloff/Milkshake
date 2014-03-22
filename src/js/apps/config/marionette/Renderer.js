Backbone.Marionette.Renderer.render = function(templateId, data){
  
  var template = TWM.templates[templateId];
  var html = ejs.render(template, data);
  return html;
}
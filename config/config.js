var config = require('./application_ini');

function recurse(initial, update){
  var result = update;
  for(var prop in initial){
    if({}.hasOwnProperty.call(initial, prop)){
      if  (typeof(update[prop]) === 'undefined') {
        result[prop] = initial[prop];
      }
      if({}.hasOwnProperty.call(update, prop)){
        if(typeof initial[prop] === 'object' && typeof update[prop] === 'object'){
          result[prop] = recurse(initial[prop], update[prop]);
        }
        else{
          result[prop] = update[prop];
        }
      }
    }
  }
  return result;
}

/**
* Singleton Config object, provides access to config params
*/
var Config = (function () {

  var instance;
  var current;
  var env = process.env.NODE_ENV || 'development';

  if (!instance) {

    var update, initial;
    var aConfig = config;
    for (var index in config) {
      if ({}.hasOwnProperty.call(config, index)) {
        if (typeof(initial) == 'undefined') {
          initial = {};
        } else {
          initial = current;
        }
        update = config[index];
        current = recurse(initial, update);
        if (index == env) {
          break;
        }
      }
    }

    instance = current;
  }

  return instance;

})();

exports.Config = Config;
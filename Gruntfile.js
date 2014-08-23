module.exports = function(grunt){

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    watch: {
      compass: {
        files: "./assets/scss/**/*.scss",
        tasks: "compass:dist",
        options: {
          interrupt: true
        }
      },
      concat_app: {
        files: "./assets/js/**/*",
        tasks: "concat:app"
      },
      templates: {
        files: "./assets/templates/**/*",
        tasks: "jsttojs:templates"
      }
    },
    compass: {
      dist: {
        options: {
          sassDir: './assets/scss/',
          cssDir: './public/css/',
          imagesDir: './public/img/'
        }
      }
    },
    concat: {
      vendor: {
        src: [
          "./assets/lib/modernizr/modernizr.js",
          "./assets/lib/jquery/dist/jquery.js",
          "./assets/lib/underscore/underscore.js",
          "./assets/lib/backbone/backbone.js",
          "./assets/lib/backbone.marionette/lib/backbone.marionette.js",
          "./assets/lib/ejs/ejs.js",
          "./assets/popcorn-complete.min.js"
          ],
        dest: "./public/js/vendors.js"
      },
      app: {
        src: "./assets/js/**/*.js",
        dest: "./public/js/app.js"
      }
    },
    jsttojs: {
      root: "./assets/templates",
      output: "public/js/templates.js",
      ext: "ejs",
      name: "TWM.templates",
      removebreak: true
    }
  });

  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-sass");
  grunt.loadNpmTasks("grunt-contrib-compass");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-jsttojs");

  grunt.registerTask("build", ["jsttojs", "concat:vendor", "concat:app", "compass:dist"]);
  grunt.registerTask("default", ["build", "watch"]);
}
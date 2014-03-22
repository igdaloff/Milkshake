module.exports = function(grunt){

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    watch: {
      compass: {
        files: "./src/scss/**/*.scss",
        tasks: "compass:dist",
        options: {
          interrupt: true
        }
      },
      concat_app: {
        files: "./src/js/**/*",
        tasks: "concat:app"
      },
      templates: {
        files: "./src/templates/**/*",
        tasks: "jsttojs:templates"
      }
    },
    compass: {
      dist: {
        options: {
          sassDir: './src/scss/',
          cssDir: './public/css/',
          imagesDir: './public/img/'
        }
      }
    },
    concat: {
      vendor: {
        src: [
          "./src/lib/modernizr/modernizr.js",
          "./src/lib/jquery/dist/jquery.js",
          "./src/lib/underscore/underscore.js",
          "./src/lib/backbone/backbone.js",
          "./src/lib/backbone.marionette/lib/backbone.marionette.js",
          "./src/lib/ejs/ejs.js",
          "./src/popcorn-complete.min.js"
          ],
        dest: "./public/js/vendors.js"
      },
      app: {
        src: "./src/js/**/*.js",
        dest: "./public/js/app.js"
      }
    },
    jsttojs: {
      root: "src/templates",
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
}
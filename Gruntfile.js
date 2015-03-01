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
      },
      jshint: {
        files: ['Gruntfile.js', 'assets/js/**/*.js', 'app/**/*.js'],
        tasks: 'jshint'
      }
    },
    jshint: {
      all: ['Gruntfile.js', 'assets/js/**/*.js', 'app/**/*.js']
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
          "./assets/bower_components/modernizr/modernizr.js",
          "./assets/bower_components/jquery/dist/jquery.js",
          "./assets/bower_components/underscore/underscore.js",
          "./assets/bower_components/backbone/backbone.js",
          "./assets/bower_components/backbone.marionette/lib/backbone.marionette.js",
          "./assets/bower_components/ejs/ejs.js",
          "./assets/popcorn-complete.min.js",
          "./assets/bower_components/Autolinker.js/dist/Autolinker.js",
          "./assets/bower_components/perfect-scrollbar/src/perfect-scrollbar.js",
          "./assets/vendors/js/jquery-ui-1.11.3.custom/jquery-ui.js"
          ],
        dest: "./public/js/vendors.js"
      },
      app: {
        src: "./assets/js/**/*.js",
        dest: "./public/js/app.js"
      }
    },
    uglify: {
      vendors: {
        files: {
          './public/js/vendors.min.js': ['./public/js/vendors.js']
        }
      },
      app: {
        files: {
          './public/js/app.min.js': ['./public/js/app.js']
        }
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

  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-sass");
  grunt.loadNpmTasks("grunt-contrib-compass");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-jsttojs");

  grunt.registerTask("build", ["jsttojs", "concat:vendor", "concat:app", "compass:dist"]);
  grunt.registerTask("default", ["jshint", "build", "watch"]);
  grunt.registerTask("prod", ["build", "uglify"]);
};
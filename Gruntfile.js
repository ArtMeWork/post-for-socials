module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		loopback_sdk_angular: {
	    services: {
	      options: {
	        input: 'server/server.js',
	        output: 'client/scripts/services/lb-services.js'
	      }
	    }
	  },
		connect: {
			server: {
				options: {
					port: '4000',
					base: 'client'
				}
			}
		},
		less: {
			development: {
				options: {
					paths: ['client/libs/bootstrap/less']
				},
				files: {
					'client/styles/main.css': 'client/styles/main.less'
				}
			}
		},
		watch: {
			configFiles: {
				files: ['Gruntfile.js']
			},
			html: {
				files: 'client/**/*.html'
			},
			styles: {
				files: ['client/styles/**/*.less'],
				tasks: ['less']
			},
			scripts: {
				files: ['client/scripts/**/*.js']
			},
			livereload: {
				files: ['client/**/*.html','client/**/*.js','client/**/*.css'],
				options: {
					livereload: true
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-loopback-sdk-angular');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-less');

	grunt.registerTask('build', ['loopback_sdk_angular']);
	grunt.registerTask('default', ['connect', 'watch']);
	grunt.registerTask('style', ['less', 'watch']);
};
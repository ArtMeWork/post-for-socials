module.exports = grunt => {
	require('time-grunt')(grunt);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		loopback_sdk_angular: {
	    local: {
	      options: {
	      	apiUrl: '/api',
	        input: 'server/server.js',
	        output: 'client/scripts/services/lb-services.js'
	      }
	    },
	    remote: {
	    	options: {
	      	apiUrl: 'https://socpost.herokuapp.com/api',
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
		clean: {
			build: ['client/build'],
			ghPages: ['client/ghpages']
		},
		copy: {
			production: {
				files: [
					{expand: true, cwd: 'client/libs/bootstrap/fonts', src: '**', dest: 'client/build/fonts/'},
					{expand: true, cwd: 'client/fonts', src: '**', dest: 'client/build/fonts/'},
					{expand: true, cwd: 'client/images', src: '**', dest: 'client/build/images/'}
				]
			},
			ghPages: {
				files: [
					{expand: true, cwd: 'client/build', src: '**', dest: 'client/ghpages/'},
					{expand: true, cwd: 'client/views', src: '**', dest: 'client/ghpages/views/'},
					{expand: true, cwd: 'client', src: 'README.md', dest: 'client/ghpages/'}
				]
			}
		},
		less: {
			bootstrap: {
				options: {
					paths: ['client/libs/bootstrap/less/'],
					modifyVars: {
						'vars': '"development"'
					}
				},
				files: {
					'client/styles/bootstrap.css': 'client/styles/_bootstrap.less',
				}
			},
			development: {
				options: {
					paths: ['client/libs/bootstrap/less/'],
					modifyVars: {
						'vars': '"development"'
					}
				},
				files: {
					'client/styles/main.css': 'client/styles/main.less'
				}
			},
			production: {
				options: {
					paths: ['client/libs/bootstrap/less/'],
					modifyVars: {
						'vars': '"production"'
					}
				},
				files: {
					'client/build/css/bootstrap.css': 'client/styles/_bootstrap.less',
					'client/build/css/main.css': 'client/styles/main.less'
				}
			}
		},
		cssmin: {
			production: {
				files: {
					'client/build/css/style.min.css': 
						['client/build/css/bootstrap.css',
						 'client/libs/angular-ui-notification/dist/angular-ui-notification.min.css',
						 'client/build/css/main.css']
				}
			}
		},
		uglify: {
			production: {
				files: {
					'client/build/js/app.min.js': 
						['client/libs/jquery/dist/jquery.min.js',
						 'client/libs/angular/angular.min.js',
						 'client/libs/bootstrap/dist/js/bootstrap.min.js',
						 'client/libs/angular-ui-router/release/angular-ui-router.min.js',
						 'client/libs/angular-resource/angular-resource.min.js',
						 'client/libs/oauth-js/dist/oauth.min.js',
						 'client/libs/angular-ui-notification/dist/angular-ui-notification.min.js',
						 'client/scripts/app.js',
						 'client/scripts/post.js',
						 'client/scripts/auth.js',
						 'client/scripts/user.js',
						 'client/scripts/services/lb-services.js']
				}
			}
		},
		processhtml: {
			options: {
				strip: true
			},
			production: {
				files: {
					'client/index.html': ['client/index_dev.html']
				}
			},
			development: {
				files: {
					'client/index.html': ['client/index_dev.html']
				}
			},
			ghPages: {
				files: {
					'client/ghpages/index.html': ['client/index_dev.html']
				}
			}
		},
		watch: {
			configFiles: {
				files: ['Gruntfile.js'],
				options: {
					reload: true
				}
			},
			html: {
				files: 'client/**/*.html'
			},
			less: {
				files: ['client/styles/*.less'],
				tasks: ['less:development']
			},
			bootstrap: {
				files: ['client/styles/_bootstrap.less', 'client/styles/_vars*.less'],
				tasks: ['less:bootstrap']
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
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-processhtml');

	grunt.registerTask('build', ['clean:build', 'less:production', 'cssmin:production', 'copy:production', 'loopback_sdk_angular:local', 'uglify:production', 'processhtml:production']);
	grunt.registerTask('dev-without-node', ['less:development', 'processhtml:development', 'loopback_sdk_angular:remote']);
	grunt.registerTask('dev', ['dev-without-node', 'loopback_sdk_angular:local']);
	grunt.registerTask('ghPages', ['clean:build', 'less:production', 'cssmin:production', 'copy:production', 'loopback_sdk_angular:remote', 'uglify:production', 'processhtml:production', 'copy:ghPages', 'processhtml:ghPages']);
	grunt.registerTask('default', ['connect', 'watch']);
};
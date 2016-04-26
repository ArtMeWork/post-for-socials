"use strict";

var app = angular.module('postApp', ['ui.router', 'ngResource', 'lbServices', 'ui-notification']);
app
.config(['$stateProvider', '$urlRouterProvider', 'NotificationProvider', function($stateProvider, $urlRouterProvider, NotificationProvider) {
	$urlRouterProvider.
		otherwise("/hello");
	$stateProvider
		.state('hello', {
			url: '/hello',
			template: "Hello world!"
		})
		.state('home', {
			url: "/",
			templateUrl: "views/my.post.html",
			controller: "MyPostCtrl",
			auth: true
		})
		.state('signup', {
			url: "/sign-up",
			templateUrl: "views/reg.auth.html",
			controller: "RegAuthCtrl"
		})
		.state('login', {
			url: "/login",
			templateUrl: "views/login.auth.html",
			controller: "LoginAuthCtrl"
		})
		.state('logout', {
			url: "/logout",
			controller: "LogoutAuthCtrl",
			auth: true
		})
		.state('settings', {
			url: "/settings",
			templateUrl: "views/settings.user.html",
			controller: "SettingsUserCtrl",
			auth: true
		});

		NotificationProvider.setOptions({
      delay: 5000,
      startTop: 20,
      startRight: 10,
      verticalSpacing: 20,
      horizontalSpacing: 20,
      positionX: 'right',
      positionY: 'top'
    });
}])
.run(['$rootScope', '$state', 'Author', 'socialsService', function($rootScope, $state, User, socialsService) {
	socialsService.setCredentials({
		app_id: "Gu74r20E9GstEHuQU_qneaw7OVI",
		socials: {
			twitter: function(result) {
				return {
					access_token_key: result.oauth_token,
					access_token_secret: result.oauth_token_secret
				};
			},
			facebook: function(result) {
				return {
					access_token: result.access_token
				};
			},
			vk: function(result) {
				return {
					access_token: result.access_token
				};
			}
		},
		alias: {
			vk: {
				en: 'Vkontakte',
				ru: 'Вконтакте',
				site: 'vk.com'
			},
			facebook: {
				en: 'Facebook',
				ru: 'Фейсбук',
				site: 'facebook.com'
			},
			twitter: {
				en: 'Twitter',
				ru: 'Твиттер',
				site: 'twitter.com'
			}
		}
	});

	if (localStorage.getItem('$LoopBack$accessTokenId')) {
		var _token = localStorage.getItem('$LoopBack$accessTokenId'),
				_userId = localStorage.getItem('$LoopBack$currentUserId');

		$rootScope.currentUser = {
			tokenId: _token,
			id: _userId
		};

		User.findById({
			id: _userId
		}, function(data) {
			$rootScope.currentUser = {
				tokenId: _token,
				id: _userId,
				email: data.email,
				userName: data.username,
				showName: data.username || data.email,
				socials: socialsService.socials()
			};
			socialsService.isConnected().finally(function() {
				try {
					$rootScope.currentUser.avatar = $rootScope.currentUser.socials[data.avatar].avatar;
				} catch (err) {
					$rootScope.currentUser.avatar = data.avatar;
				}
			});
		},
		function(err) {
			if(err.data && err.data.error) {
				if(err.data.error.code==="AUTHORIZATION_REQUIRED") {
					localStorage.setItem('$LoopBack$accessTokenId','');
					localStorage.setItem('$LoopBack$currentUserId','');
					$rootScope.currentUser = null;
					$state.go('login');
				}
			}
		});
	}

	$rootScope.$on('$stateChangeStart', function(event, next) {
		angular.element('body').removeClass('menu-showed');
    if (next.auth && !$rootScope.currentUser) {
      event.preventDefault();
      $state.go('hello');
    }
  });
}])
.factory('socialsService', ['$q', '$rootScope', 'Author', 'Notification', function($q, $rootScope, User, Notification) {
	var priv, pub;
	priv = {
		credentials: {},
		remember: function(provider, user) {
			if(provider) {
				$rootScope.currentUser.socials[provider] = user;
				$rootScope.currentUser.socials.connected = $rootScope.currentUser.socials;
			} else
				if(!provider && typeof user === "object")
					$rootScope.currentUser.socials.connected = user;
		}
	};
	pub = {
		setCredentials: function(credentials) {
			priv.credentials = credentials;
		},
		connect: function(provider) {
			var defer = $q.defer();
			OAuth.initialize(priv.credentials.app_id);
			OAuth.popup(provider, {cache: false}, function(error, result) {
				if (!error) {
					User.connect({
		  			id: $rootScope.currentUser.id,
		  			provider: provider,
		  			params: priv.credentials.socials[provider](result)
		  		}).$promise.then(function(data) {
		  			priv.remember(provider, data.connected);
		  			defer.resolve(data);
		  		}, function(err) {
		  			if(err.data.error && err.data.error.message=="PROVIDER_NOT_FOUND")
		  				Notification.error('Подключение к "'+pub.alias[provider].ru+'" сейчас не возможно.');
		  			else 
		  				Notification.error('Ошибка записи данных');
						console.error('Error insert tokens: ', error);
		  			defer.reject(err);
		  		});
				} else {
		  		Notification.error('Ошибка подключения "'+pub.alias[provider].ru+'"');
					console.error(provider+' not connected: ', error);
					defer.reject(error);
				}
			});
			return defer.promise;
		},
		isConnected: function() {
			var defer = $q.defer();
			User.isConnected({
				id: $rootScope.currentUser.id
			}).$promise.then(function(socials) {
				priv.remember(null, socials.connected);
				defer.resolve(socials);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		},
		disconnect: function(provider) {
			var defer = $q.defer();
			User.disconnect({
				id: $rootScope.currentUser.id,
				provider: provider
			}, function(res) {
				priv.remember(provider, false);
				defer.resolve(res);
			}, function(err) {
				if(typeof err==="object" && err.data.error.message==="NOT_CONNECTED") {
					priv.remember(provider, false);
					defer.resolve();
				} else {
					Notification.error("Ошибка отключения " + err.config.data.provider + err);
					console.log("Ошибка отключения " + err.config.data.provider, err);
					defer.reject(err);
				}
			});
			return defer.promise;
		},
		socials: function(soc) {
			var socials = {}, connected = [], not_connected = [];
			Object.keys(priv.credentials.socials).forEach(function(social) {
				socials[social] = false;
			});
			Object.defineProperty(socials, 'enabled', {
				enumerable: false,
				configurable: false,
				get: function(provider) {
					if (provider)
						return socials[provider] ? true : false; else
						return Object.keys(socials).length;
				}
			});
			Object.defineProperty(socials, 'connected', {
				enumerable: false,
				configurable: false,
				get: function() {
					return connected;
				},
				set: function(newSocials) {
					connected = [];
					not_connected = Object.keys($rootScope.currentUser.socials);
					for(var key in newSocials) {
						socials[key] = newSocials[key];
						if(newSocials[key]) {
							var _social = {};
							_social = newSocials[key];
							_social.provider = key;
							connected.push(_social);
							not_connected.splice(not_connected.indexOf(key), 1);
						}
					}
				}
			});
			Object.defineProperty(socials, 'not_connected', {
				enumerable: false,
				configurable: false,
				get: function() {
					return not_connected;
				}
			});
			return socials;
		},
		get alias() {
			return angular.copy(priv.credentials.alias);
		}
	};

	return pub;
}])
.directive('title', function() {
	return function(scope, e) {
		e.tooltip({container: 'body'});
		scope.$on('$destroy', function() {
			e.tooltip('destroy');
			angular.element('.tooltip').remove();
		});
	};
})
.factory('Posts', ['$rootScope', '$q', '$timeout', 'Author', 'Notification', 'socialsService', function($rootScope, $q, $timeout, User, Notification, socialsService) {
	var priv = {
		posts: [],
		skip: 0,
		limit: 10
	};
	function setConf(conf) {
		for (var key in conf) {
			priv[key] = conf[key];
		}
	}
	function newPost(text, socials) {
		var defer = $q.defer();
		User.prototype$__create__posts({id:$rootScope.currentUser.id}, {
			text: text,
			socials: socials
		}, function(data) {
			var err = false;
			priv.posts.splice(0,0,data);
			priv.skip += 1;
			if(data.send_socials)
				for(var provider in data.send_socials)
					if(!data.send_socials[provider] || data.send_socials[provider].error) {
						err = true;
						if(data.send_socials[provider])
							switch(data.send_socials[provider].error) {
								case 'NOT_CONNECTED':
									Notification.error("Вы не подключили \""+socialsService.alias[provider].ru+"\"");
								break;
								case 'PROVIDER_NOT_FOUND':
									Notification.error("Социальная сеть \""+socialsService.alias[provider].ru+"\" не доступна.");
								break;
								default:
									Notification.error("Ошибка отправки в \""+socialsService.alias[provider].ru+"\"");
								break;
							}
					}
			if(!err) Notification.success('Сообщение отправлено');
			defer.resolve(data);
		}, function(err) {
			Notification.error("Ошибка отправки сообщения");
			defer.reject(err);
		});
		return defer.promise;
	}
	function removePost(index) {
		var defer = $q.defer();
		User.prototype$__destroyById__posts({
			id: $rootScope.currentUser.id,
			fk: priv.posts[index].id
		}, function(res){
			angular.element('#post-'+priv.posts[index].id).addClass('in-remove');
			$timeout(function() {
				priv.posts.splice(index, 1);
				defer.resolve();
			}, 500);
		}, defer.reject);
		return defer.promise;
	}
	function pullPosts() {
		var defer = $q.defer();
		User.prototype$__get__posts({
			id: $rootScope.currentUser.id,
			filter: {limit: priv.limit, order: 'date DESC', skip: priv.skip}
		}, function(data) {
			priv.posts.push.apply(priv.posts, data);
			priv.skip += data.length;
			data.length < priv.limit ?
				defer.resolve("END") :
				defer.resolve(priv.posts);
		}, defer.reject);
		return defer.promise;
	}
	function getPosts() {
		return priv.posts.length ? priv.posts : null;
	}

	return {
		add: newPost,
		remove: removePost,
		getPosts: getPosts,
		pull: pullPosts,
		setConf: setConf
	}
}])
.controller('AsideCtrl', ['$scope', function($scope) {
	$scope.pageUp = function() {
		angular.element('body').animate({
			scrollTop: 0
		}, 500);
		angular.element('body').removeClass('menu-showed');
	};
	$scope.toggleMenu = function() {
		angular.element('body').toggleClass('menu-showed');
	};
}]);
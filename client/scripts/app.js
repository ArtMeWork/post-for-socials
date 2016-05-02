"use strict";

var app = angular.module('postApp', ['ui.router', 'ngResource', 'lbServices', 'ui-notification']);
app
.config(['$stateProvider', '$urlRouterProvider', 'NotificationProvider', function($stateProvider, $urlRouterProvider, NotificationProvider) {
	$urlRouterProvider.otherwise("/");
	$stateProvider
		.state('app', {
			templateUrl: "views/main.html"
		})
		.state('app.home', {
			url: "/",
			templateUrl: "views/main.posts.html",
			controller: "MyPostCtrl",
			auth: true
		})
		.state('app.settings', {
			url: "/settings",
			templateUrl: "views/main.settings.html",
			controller: "SettingsUserCtrl",
			auth: true
		})
		.state('landing', {
			url: "/",
			templateUrl: "views/landing.html",
			only_guest: true
		})
		.state('landing.login', {
			url: "login",
			templateUrl: "views/landing.login.html",
			controller: "LoginAuthCtrl",
			only_guest: true
		})
		.state('landing.signup', {
			url: "sign-up",
			templateUrl: "views/landing.reg.html",
			controller: "RegAuthCtrl",
			only_guest: true
		})
		.state('landing.privacy', {
			url: "privacy",
			templateUrl: "views/privacy.html",
			only_guest: true
		})
		.state('logout', {
			url: "/logout",
			controller: "LogoutAuthCtrl",
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

	var _token = localStorage.getItem('$LoopBack$accessTokenId'),
			_userId = localStorage.getItem('$LoopBack$currentUserId');
	if (_token && _userId) {

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
					localStorage.removeItem('$LoopBack$accessTokenId');
					localStorage.removeItem('$LoopBack$currentUserId');
					localStorage.removeItem('$LoopBack$rememberMe');
					$rootScope.currentUser = null;
					$state.go('landing');
				}
			}
		});
	}

	$rootScope.$on('$stateChangeStart', function(event, next) {
		angular.element('body').removeClass('menu-showed');
    if (next.auth && !$rootScope.currentUser) {
      event.preventDefault();
      $state.go('landing');
    } else
    if (next.only_guest && $rootScope.currentUser) {
    	event.preventDefault();
    	$state.go('app.home');
    }
  });
  $rootScope.$on('$stateChangeSuccess', function() {
  	document.body.scrollTop = document.documentElement.scrollTop = 0;
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
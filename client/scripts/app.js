'use strict';

var app = angular.module('postApp', ['ui.router', 'ngResource', 'lbServices']);
app
.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
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
		.state('forbidden', {
			url: "/forbidden",
			template: "<div class='text-center'><h2>403 Access Forbidden</h2><br><p><a ui-sref='login'>Please login</a></p></div>"
		})
		.state('settings', {
			url: "/settings",
			templateUrl: "views/settings.user.html",
			controller: "SettingsUserCtrl",
			auth: true
		});
}])
.run(['$rootScope', '$state', 'Author', 'socialsService', function($rootScope, $state, User, socialsService) {
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
				showName: data.username || data.email
			};
			socialsService.isConnected();
		},
		function() {
			localStorage.setItem('$LoopBack$accessTokenId',''),
			localStorage.setItem('$LoopBack$currentUserId','');
			$rootScope.currentUser = null;
			$state.go('login');
		});
	}

	$rootScope.$on('$stateChangeStart', function(event, next) {
    if (next.auth && !$rootScope.currentUser) {
      event.preventDefault();
      $state.go('forbidden');
    }
  });
}])
.factory('socialsService', ['$q', '$rootScope', 'Author', function($q, $rootScope, User) {
	var pub = {
		connect: function(provider) {
			var defer = $q.defer();
			OAuth.initialize('Gu74r20E9GstEHuQU_qneaw7OVI');
			OAuth.popup(provider, {cache:false, state: "U3hCQ7Ogq5qmi6T0uu4Zq7fJWYtfaiqS8Pagczy"}, function(error, result) {
				if (!error) {
					User.connect({
		  			id: $rootScope.currentUser.id,
		  			provider: provider,
		  			key: result.oauth_token,
		  			secret_key: result.oauth_token_secret
		  		}).$promise.then(function(data) {
		  			$rootScope.currentUser[provider] = data.connected.screen_name;
		  			pub.remember(provider, data.connected.screen_name);
		  			defer.resolve(data);
		  		}, function(err) {
		  			alert('Ошибка записи данных');
						console.error('Error insert tokens: ', error);
		  			defer.reject(err);
		  		});
				} else {
		  		alert('Ошибка подключения '+provider);
					console.error(provider+' not connected: ', error);
					defer.reject(error);
				}
			});
			return defer.promise;
		},
		remember: function(provider, name) {
			localStorage.setItem('connect_'+provider, name);
			$rootScope.currentUser[provider] = name;
		},
		isConnected: function() {
			User.isConnected({
				id: $rootScope.currentUser.id
			}).$promise.then(function(socials) {
				for(var provider in socials.connected) {
					pub.remember(provider, socials.connected[provider]);
				}
			});
		}
	};

	return pub;
}]);
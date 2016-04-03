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
			controller: "SettingsUserCtrl"
		});
}])
.run(['$rootScope', '$state', 'Author', function($rootScope, $state, User) {
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
		},
		function() {
			localStorage.clear();
			$rootScope.currentUser = null;
			$state.go('hello');
		});
	}

	$rootScope.$on('$stateChangeStart', function(event, next) {
    if (next.auth && !$rootScope.currentUser) {
      event.preventDefault();
      $state.go('forbidden');
    }
  });
}]);
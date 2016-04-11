app
.controller('RegAuthCtrl', ['$scope', 'Author', '$state', function($scope, User, $state) {
	$scope.reg = {
		login: null,
		email: null,
		password: null,
		stat: null,
		send: function () {
			User.create({
				username: this.login,
				email: this.email,
				password: this.password
			}, function(){
				$state.go('login');
			}, function(err){
				alert('При регистрации произошла ошибка (подробности в консоли)');
				console.log("При регистрации произошла ошибка: "+err.data.error.message);
			})
		}
	};
}])
.controller('LoginAuthCtrl', ['$rootScope', '$scope', 'Author', '$state', 'socialsService', function($rootScope, $scope, User, $state, socialsService) {
	var enter = false;
	$scope.login = {
		login: "meridos@mail.ru",
		password: "admintema",
		send: function () {
			var _name=_email=null;
			this.login.indexOf("@")===-1 ? _name = this.login : _email = this.login;
			if(!enter) {
				enter = true;
				loginForm.sendBtn.disabled = true;
				User.login({
					username: _name,
					email: _email,
					password: this.password
				}, function(data) {
					$rootScope.currentUser = {
						tokenId: data.id,
						id: data.userId,
						email: data.user.email,
						userName: data.user.username,
						showName: data.user.username || data.user.email,
						socials: data.socials
					};
					$state.go('home');
				}, function(err) {
					loginForm.sendBtn.disabled = false;
					enter = false;
					alert('Login is failed');
				});
			}
		}
	}
}])
.controller('LogoutAuthCtrl', ['$rootScope', '$state', 'Author', function($rootScope, $state, User) {
	User.logout({})
	.$promise
	.then(function() {
		$rootScope.currentUser = null;
		$state.go('hello');
	});
}])


.directive('username', ['Author', function(User) {
	return {
		require: 'ngModel',
		restrict: 'A',
		link: function(scope, element, attrs, ngModel) {
			ngModel.$validators.username = function(val) {
				if(val)
					User.usernameExist({username: val}).$promise.then(function(res) {
						if(res.usernameExist) {
							ngModel.$setValidity('username', false);
						} else {
							ngModel.$setValidity('username', true);
						}
					}, function() {
						ngModel.$setValidity('username', true);
					});
				return true;
			};
		}
	}
}])
.directive('confirmPass', function() {
	return {
		require: 'ngModel',
		restrict: 'A',
		scope: {
			password: '=confirmPass'
		},
		link: function(scope, element, attrs, ngModel) {
				ngModel.$validators.confirmPassword = function(val) {
					return val === scope.password;
				};
				scope.$watch("password", function(a) {
					ngModel.$validate();
				});
		}
	}
});
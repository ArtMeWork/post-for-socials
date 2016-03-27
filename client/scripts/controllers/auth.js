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
.controller('LoginAuthCtrl', ['$rootScope', '$scope', 'Author', '$state', function($rootScope, $scope, User, $state) {
	$scope.login = {
		login: "meridos",
		password: "admintema",
		send: function () {
			var _name=_email=null;
			this.login.indexOf("@")===-1 ? _name = this.login : _email = this.login;
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
					showName: data.user.username || data.user.email
				};
				$state.go('home');
			}, function(err) {
				alert('Login is failed');
			})
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
}]);
app
.controller('SettingsUserCtrl', ['$scope', 'Author', '$rootScope', 'socialsService', function($scope, User, $rootScope, socialsService) {

  $scope.connect = function(provider) {
  	socialsService.connect(provider);
  };
  $scope.disconnect = socialsService.disconnect;

	var defaultSettings = angular.copy($scope.settings);
	$scope.settings = {
		username: "",
		password: "",
		confirmPassword: "",
		deleteUsername: false
	};
	$scope.send = function() {
		var _settings = {
			username: this.settings.username,
			password: this.settings.password
		},
		_send = {},
		_sendIsEmpty = true;
		for (var key in _settings) {
			if (_settings[key]) {
				_send[key]=_settings[key];
				_sendIsEmpty = false;
			}
		}
		if (this.settings.deleteUsername) {_send.username = ""; _sendIsEmpty=false;};
		if (!_sendIsEmpty) {
			_send.id = $rootScope.currentUser.id;
			User.prototype$updateAttributes(_send).$promise.then(function(data){
				$rootScope.currentUser.userName = data.username;
				$rootScope.currentUser.showName = data.username || data.email;
				$scope.settings = angular.copy(defaultSettings);
				alert('Ваши найстройки успешно изменены!');
			}, function(err) {
				console.log(err);
				alert('Ошибка при изменении настроек.\nСм. консоль.');
			});
		}
	}
}]);
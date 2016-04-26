app
.controller('SettingsUserCtrl', ['$scope', 'Author', '$rootScope', 'socialsService', 'Notification', function($scope, User, $rootScope, socialsService, Notification) {

  $scope.connect = function(provider) {
  	socialsService.connect(provider);
  };

  $scope.disconnect = socialsService.disconnect;

  $scope.alias = socialsService.alias;

	var defaultSettings = {
		username: "",
		password: "",
		confirmPassword: "",
		deleteUsername: false,
		deleteAvatar: false,
		avatar_socials: "",
		avatar_url: ""
	};

	$scope.settings = angular.copy(defaultSettings);

	$scope.updateAvatar = function(model) {
		model === "url" ? $scope.settings.avatar_socials = $scope.settings.deleteAvatar = "" :
			model === "delete" ? $scope.settings.avatar_socials = $scope.settings.avatar_url = "" :
				$scope.settings.avatar_url = $scope.settings.deleteAvatar = "";
	};

	$scope.updateName = function(name) {
		typeof name === "boolean" ?
			$scope.settings.username = "" :
			$scope.settings.deleteUsername = false;
	};

	$scope.send = function() {
		var avatar = this.settings.avatar_url || this.settings.avatar_socials || null,
		_settings = {
			username: this.settings.username,
			password: this.settings.password,
			avatar: avatar
		},
		_send = {},
		_sendIsEmpty = true;
		for (var key in _settings) {
			if (_settings[key]) {
				_send[key]=_settings[key];
				_sendIsEmpty = false;
			}
		}
		if (this.settings.deleteUsername) {_send.username = null; _sendIsEmpty=false;};
		if (this.settings.deleteAvatar) {_send.avatar = null; _sendIsEmpty=false;};
		if (!_sendIsEmpty) {
			_send.id = $rootScope.currentUser.id;
			User.prototype$updateAttributes(_send).$promise.then(function(data) {
				$rootScope.currentUser.userName = data.username;
				try {
					$rootScope.currentUser.avatar = data.avatar ? $rootScope.currentUser.socials[data.avatar].avatar : "#";
				} catch (err) {
					$rootScope.currentUser.avatar = data.avatar;
				}
				$rootScope.currentUser.showName = data.username || data.email;
				$scope.settings = angular.copy(defaultSettings);

				Notification.success('Ваши найстройки успешно изменены!');
			}, function(err) {
				if(err.usernameExist)
					Notification.error('Это имя уже занято. Введите другое.');
				else {
					console.log(err);
					Notification.error('Ошибка при изменении настроек, проверьте вводимые данные.');
				}
			});
		}
	}
}]);
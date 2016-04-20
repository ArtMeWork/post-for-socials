app
.controller('MyPostCtrl', ['$scope', '$rootScope', 'Author', 'socialsService', 'Notification', function ($scope, $rootScope, User, socialsService, Notification) {
	
	$scope.posts = null;

	var getPosts = function() {
		User.posts({
			id: $rootScope.currentUser.id
		}, function(data) {
			$scope.posts = data;
		});
	};

	getPosts();

	$scope.newPost = {
		text: null,
		socials: [],
		check: function(item) {
			$scope.newPost.socials.indexOf(item) === -1 ?
			$scope.newPost.socials.push(item) :
			$scope.newPost.socials.splice($scope.newPost.socials.indexOf(item), 1);
		},
		send: function() {
			User.posts.create({id:$rootScope.currentUser.id}, {
				text: $scope.newPost.text,
				socials: $scope.newPost.socials
			}, function(data) {
				$scope.newPost.text = null;
				$scope.newPost.socials = [];
				$scope.posts.push(data);
				if(data.send_socials)
					for(var provider in data.send_socials)
						if(!data.send_socials[provider] || data.send_socials[provider].error) {
							Notification.error("Ошибка отправки в \""+socialsService.alias[provider].ru+"\"");
						}
			});
		}
	};

	$scope.remove = function(id) {
		$scope.posts.some(function(post, index) {
			if (post.id == id) {
				User.posts.destroyById({
					id: $rootScope.currentUser.id,
					fk: id
				}, function(res){
					$scope.posts.splice(index, 1);
					return true;
				});
			}
		});
	};

}]);
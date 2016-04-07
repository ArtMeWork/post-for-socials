app
.controller('MyPostCtrl', ['$scope', '$rootScope', 'Author', function ($scope, $rootScope, User) {

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
				getPosts();
				if(data.socials.length)
					for(var provider in data.send_socials)
						if(!data.send_socials) alert("Ошибка отправки в "+provider);
			});
		}
	};

}]);
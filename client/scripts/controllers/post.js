app
.controller('MyPostCtrl', ['$scope', '$rootScope', 'Author', 'Post', function ($scope, $rootScope, User, Post) {

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
			Post.create({
				text: $scope.newPost.text,
				socials: $scope.newPost.socials
			}, function() {
				$scope.newPost.text = null;
				$scope.newPost.socials = [];
				getPosts();
			});
		}
	};

}]);
app
.controller('MyPostCtrl', ['$scope', '$rootScope', '$timeout', '$filter', 'Author', 'Posts', function($scope, $rootScope, $timeout, $filter, User, Posts) {
	var postsConf = {
		posts: [],
		limit: 10,
		skip: 0
	};

	$scope.posts = [];
	$scope.posts_not_end = true;
	$scope.remove = Posts.remove;
	
	Posts.setConf(postsConf);
	Posts.pull().finally(function() {
		$scope.$watch(function() {return Posts.getPosts()}, function(posts) {
			$scope.posts = posts;
		}, true);
	});

	$scope.loadMore = function() {
		if($scope.posts_not_end===true) {
			$scope.posts_not_end = "load";
			Posts.pull().then(function(res) {
				if (res==="END") $scope.posts_not_end = false; else $scope.posts_not_end = true;
			});
		}
	};

}])
.controller('AddPostCtrl', ['$scope', 'Author', 'Posts', 'Notification', function($scope, User, Posts, Notification) {
	function twitterValid() {
		if ($scope.newPost.text.length>=140 && $scope.newPost.socials.indexOf('twitter')!=-1) {
			$scope.newPost.socials.splice($scope.newPost.socials.indexOf('twitter'), 1);
			Notification('Лимит сообщения для твиттера 140 символов.');
		}
	}
	$("#addPost_text").on("keydown", function(e) {
		if ((e.keyCode == 10 || e.keyCode == 13) && e.ctrlKey) {
			if(e.target.value.trim())
				$scope.newPost.send();
		}
		twitterValid();
	});
	$scope.newPost = {
		text: "",
		socials: [],
		check: function(item) {
			$scope.newPost.socials.indexOf(item) === -1 ?
			$scope.newPost.socials.push(item) :
			$scope.newPost.socials.splice($scope.newPost.socials.indexOf(item), 1);
			twitterValid();
		},
		send: function() {
			Posts.add($scope.newPost.text, $scope.newPost.socials).then(function() {
				$scope.newPost.text = "";
				$scope.newPost.socials = [];
				$scope.addPost.$setPristine();
				angular.element('#addPost').modal('hide');
			});
		}
	};
}]);
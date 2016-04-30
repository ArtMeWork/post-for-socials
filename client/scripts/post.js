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
			if (Array.isArray(posts) && posts.length < postsConf.limit) $scope.posts_not_end = false;
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
}])
.factory('Posts', ['$rootScope', '$q', '$timeout', 'Author', 'Notification', 'socialsService', function($rootScope, $q, $timeout, User, Notification, socialsService) {
	var priv = {
		posts: [],
		skip: 0,
		limit: 10
	};
	function setConf(conf) {
		for (var key in conf) {
			priv[key] = conf[key];
		}
	}
	function newPost(text, socials) {
		var defer = $q.defer();
		User.prototype$__create__posts({id:$rootScope.currentUser.id}, {
			text: text,
			socials: socials
		}, function(data) {
			var err = false;
			priv.posts.splice(0,0,data);
			priv.skip += 1;
			if(data.send_socials)
				for(var provider in data.send_socials)
					if(!data.send_socials[provider] || data.send_socials[provider].error) {
						err = true;
						if(data.send_socials[provider])
							switch(data.send_socials[provider].error) {
								case 'NOT_CONNECTED':
									Notification.error("Вы не подключили \""+socialsService.alias[provider].ru+"\"");
								break;
								case 'PROVIDER_NOT_FOUND':
									Notification.error("Социальная сеть \""+socialsService.alias[provider].ru+"\" не доступна.");
								break;
								default:
									Notification.error("Ошибка отправки в \""+socialsService.alias[provider].ru+"\"");
								break;
							}
					}
			if(!err) Notification.success('Сообщение отправлено');
			defer.resolve(data);
		}, function(err) {
			Notification.error("Ошибка отправки сообщения");
			defer.reject(err);
		});
		return defer.promise;
	}
	function removePost(index) {
		var defer = $q.defer();
		User.prototype$__destroyById__posts({
			id: $rootScope.currentUser.id,
			fk: priv.posts[index].id
		}, function(res){
			angular.element('#post-'+priv.posts[index].id).addClass('in-remove');
			$timeout(function() {
				priv.posts.splice(index, 1);
				defer.resolve();
			}, 500);
		}, defer.reject);
		return defer.promise;
	}
	function pullPosts() {
		var defer = $q.defer();
		User.prototype$__get__posts({
			id: $rootScope.currentUser.id,
			filter: {limit: priv.limit, order: 'date DESC', skip: priv.skip}
		}, function(data) {
			priv.posts.push.apply(priv.posts, data);
			priv.skip += data.length;
			data.length < priv.limit ?
				defer.resolve("END") :
				defer.resolve(priv.posts);
		}, defer.reject);
		return defer.promise;
	}
	function getPosts() {
		return priv.posts.length ? priv.posts : null;
	}

	return {
		add: newPost,
		remove: removePost,
		getPosts: getPosts,
		pull: pullPosts,
		setConf: setConf
	}
}]);
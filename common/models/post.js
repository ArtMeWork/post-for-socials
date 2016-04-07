module.exports = function(Post) {
	Post.observe('before save', function(context, next) {
		context.instance.date = Date.now();
		next();
	});	
};

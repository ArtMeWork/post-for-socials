module.exports = function(app) {
	app.dataSources.mysqlDs.automigrate(['author', 'post'], function (err) {
		if (err) throw err;
		app.models.author.create([], function (err, model) {
			if (err) throw err;
			console.log('Model author created');
		});
		app.models.post.create([], function (err, model) {
			if (err) throw err;
			console.log('Model post created');
		});
	});
};

var path = require('path');

var app = require(path.resolve(__dirname, '../server/server'));
var ds = app.datasources.psql;
ds.automigrate(['author', 'post'], function(err) {
  if (err) throw err;

  var authors = [{
    email: "meridos@mail.ru",
    password: "admintema"
  }],
      posts = [{text:"Hello world!", date: Date.now(), authorId: 1}],
      count = authors.length + posts.length;
  authors.forEach(function(data) {
    app.models.author.create(data, function(err, model) {
      if (err) throw err;

      console.log('Created:', model);

      count--;
      if (count === 0)
        ds.disconnect();
    });
  });
  posts.forEach(function(data) {
    app.models.post.create(data, function(err, model) {
      if (err) throw err;

      console.log('Created:', model);

      count--;
      if (count === 0)
        ds.disconnect();
    });
  });
});


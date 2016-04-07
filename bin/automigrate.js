var path = require('path');

var app = require(path.resolve(__dirname, '../server/server'));
var ds = app.datasources.psql;
ds.automigrate(['author', 'post', 'AccessToken'], function(err) {
  if (err) throw err;

  var author = {
    email: "meridos@mail.ru",
    password: "admintema"
  },
  post = {
    text:"Hello world!",
    date: Date.now(),
    socials: []
  };

  app.models.author.create(author, function(err, _author) {
    if (err) throw err;

    console.log('Created:', _author);
    post.authorId = _author.id;

    app.models.post.create(post, function(err2, _post) {
      if (err2) throw err2;

      console.log('Created:', _post);

      app.models.AccessToken.create({userId: _author.id}, function(err3, token) {
        if (err3) throw err3;

        console.log('Created:', token);

        ds.disconnect();
      });
    });
  });
});


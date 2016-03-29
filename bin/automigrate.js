var path = require('path');

var app = require(path.resolve(__dirname, '../server/server'));
var ds = app.datasources.psql;
ds.automigrate('author', function(err) {
  if (err) throw err;

  var accounts = [
    {
      email: 'meridos@mail.ru',
      password: "admintema10242"
    }
  ];
  var count = accounts.length;
  accounts.forEach(function(account) {
    app.models.author.create(account, function(err, model) {
      if (err) throw err;

      console.log('Created:', model);

      count--;
      if (count === 0)
        ds.disconnect();
    });
  });
});

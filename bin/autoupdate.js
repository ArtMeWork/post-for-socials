var path = require('path');

var app = require(path.resolve(__dirname, '../server/server'));
var ds = app.datasources.psql;
ds.autoupdate(['author', 'post'], function(err, res) {
  if (err) throw err;
  console.log(res);
});
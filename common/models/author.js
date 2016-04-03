module.exports = function(Author) {
	Author.usernameExist = function(username, cb) {
    var response;
    Author.find({
      where: {
        username: username
      }
    }, function(err, instance) {
      instance.length ?
        response = true :
        response = false;
      cb(null, response);
    });
  };
  Author.remoteMethod(
    'usernameExist',
    {
      http: {path: '/usernameExist', verb: 'get'},
      accepts: {arg: 'username', type: 'string', required: true},
      returns: {arg: 'usernameExist', type: 'boolean'}
    }
  );
};
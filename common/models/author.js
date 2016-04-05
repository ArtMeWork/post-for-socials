module.exports = function(Author) {
  var twitter = require('twitter'),
  twitterClient,
  socialClients = {
    twitter: undefined
  };
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

  var twitterConnect = function(key, secret_key, cb) {
    twitterClient = new twitter({
      consumer_key: "ywPwAvJmU3by3asRWQGu0WJOh",
      consumer_secret: "Gr3cI0n66C1CWpBG732ATHpsb0AebDAZZ2xGOKpkFevnY2RJlS",
      access_token_key: key,
      access_token_secret: secret_key
    });
    // twitterClient.get('account/verify_credentials', function(error, twit_data) {
    //   var _res = false;
    //   error ? twitterClient = undefined : twitterClient.user = _res = twit_data;
    //   cb(_res);
    // });
  };

  Author.connect = function(id, provider, key, secret_key, cb) {
    var update,
    socials = {
      twitter: {
        twitter_key: key,
        twitter_secret_key: secret_key
      }
    };
    update = socials[provider];
    if(update) {
      update.id = id;
      Author.upsert(update, function(err, instance) {
        if(!err) {
          twitterConnect(key, secret_key, function(_res) {
            _res ? cb(null, _res) : cb("Tokens insert, but twitter connect problem.");
          });
        } else {
          cb("Insert tokens problem");
        }
      });
    }
  };
  Author.remoteMethod(
    'connect',
    {
      description: 'Connect your social network. With OAuth.io.',
      http: {path: '/:id/connect', verb: 'post'},
      accepts: [
        {arg: 'id', type: 'number', required: true, http: {source: 'path'}},
        {arg: 'provider', type: 'string', required: true},
        {arg: 'key', type: 'string', required: true},
        {arg: 'secret_key', type: 'string', required: true}],
      returns: {arg: 'connected', type: 'object'}
    }
  );

  Author.isConnected = function(id, cb) {
    Author.findById(id, function(err, res) {
      if(err) {
        cb(err);
      } else {
        var socials = {};
        if(twitterClient) socials.twitter=twitterClient.user.screen_name;
        cb(null, socials);
      }
    });
  };
  Author.remoteMethod(
    'isConnected',
    {
      description: 'Get connected socials list.',
      http: {path: '/:id/isConnected', verb: 'get'},
      accepts: {arg: 'id', type: 'number', required: true, http: {source: 'path'}},
      returns: {arg: 'connected', type: 'object'}
    }
  );

  Author.afterRemote('login', function(context, res, next) {
    if(res) {
      Author.findById(res.userId, function(err, data) {
        if(!err) {
          if(data.twitter_key && data.twitter_secret_key) {
            twitterConnect(data.twitter_key,data.twitter_secret_key, function(_res) {
              if(_res) {
                console.log("Twitter connected: "+twitterClient.user.screen_name);
                res.twitter = twitterClient.user.screen_name;
                next();
              } else {
                console.log("Twitter not connect.");
                next();
              }
            });
          } else next();
        } else next();
      });
    } else next();
  });

  Author.afterRemote('**.__create__posts', function(context, remoteMethodOutput, next) {
    var res = context.result;

    if(res && res.socials.length && twitterClient) {
      twitterClient.get('account/verify_credentials', function(error, twit_data, _res) {
        console.log(twit_data.name);
      });
    }

    next();
  });

};
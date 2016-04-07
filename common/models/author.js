var async = require('async');

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

  var twitterConnect = function(id, key, secret_key, cb) {
    twitterClient = new twitter({
      consumer_key: "ywPwAvJmU3by3asRWQGu0WJOh",
      consumer_secret: "Gr3cI0n66C1CWpBG732ATHpsb0AebDAZZ2xGOKpkFevnY2RJlS",
      access_token_key: key,
      access_token_secret: secret_key
    });
    twitterClient.get('account/verify_credentials', function(error, twit_data) {
      var _res = false;
      if(error) {
        socialClients.twitter = twitterClient = undefined;
        Author.upsert({
          id: id,
          twitter_key: null,
          twitter_secret_key: null
        });
      } else socialClients.twitter = _res = twit_data.screen_name;
      cb(_res);
    });
  };

  Author.connect = function(id, provider, key, secret_key, cb) {  
    if(socialClients.hasOwnProperty(provider)) {
      var params = {};
      params["id"] = id;
      params[provider+"_key"] = key;
      params[provider+"_secret_key"] = secret_key;
      Author.upsert(params, function(err, instance) {
        if(!err) {
          switch(provider) {
            case "twitter":
            twitterConnect(id, key, secret_key, function(_res) {
              _res ? cb(null, _res) : cb("Twitter connect problem.");
            });
            break;
          }
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
    Author.findById(id, function(err, data) {
      if(!err) {
        async.parallel({
          twitter: async.apply(_twitter)
        }, function(err, res) {
          cb(null, socialClients);
        });

        function _twitter(cb) {
          if(data.twitter_key && data.twitter_secret_key) {
            twitterConnect(id, data.twitter_key,data.twitter_secret_key, function(_res) {
              cb(null, _res);
            });
          } else {
            twitterClient = socialClients.twitter = undefined;
            cb(null, false);
          }
        }
      } else cb(err);
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

  Author.disconnect = function(id, provider, cb) {
    if(!socialClients[provider]) cb("NOT_CONNECTED"); else {
      var params = {};
      params["id"] = id;
      params[provider + "_key"] = null;
      params[provider + "_secret_key"] = null;
      Author.upsert(params, function(err, instance) {
        if(err) cb(err); else {
          var name = "";
          switch(provider) {
            case "twitter":
              name = socialClients.twitter;
              twitterClient = socialClients.twitter = undefined;
            break;
          }
          cb(null, name);
        }
      });
    }
  };

  Author.remoteMethod(
    'disconnect',
    {
      description: 'Disconnect social network.',
      http: {path: '/:id/disconnect', verb: 'post'},
      accepts: [
        {arg: 'id', type: 'number', required: true, http: {source: 'path'}},
        {arg: 'provider', type: 'string', required: true}],
      returns: {arg: 'disconnected', type: 'boolean'}
    }
  );

  Author.afterRemote('login', function(context, res, next) {
    Author.isConnected(res.userId, function() {
      res.socials = socialClients;
      next();
    });
  });

  Author.afterRemote('**.__create__posts', function(context, res, next) {
    if(res && res.socials.length) {
      async.parallel({
        twitter: async.apply(_twitter)
      }, function(err, _res) {
        res.send_socials = {};
        if(!err) {
          res.send_socials = {
            twitter: _res.twitter
          }
        } else res.send_socials.error = err;

        next();
      });

      function _twitter(cb) {
        for(var key in res.socials)
          if(res.socials[key]==="twitter" && twitterClient) {
            twitterClient.post('statuses/update', {status: res.text}, function(err, tweet, _res) {
              var send = false;
              if(!err) send = true;
              cb(null, send);
            });
            break;
          } else cb(null, false);
      }
    } else next();
  });
};
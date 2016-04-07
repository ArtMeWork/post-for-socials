
module.exports = function(Author) {
  var async = require('async'),
  twitter = require('twitter'),
  facebook = require('fb'),
  twitterClient = {},
  socialClients = {
    twitter: undefined,
    facebook: undefined
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
    twitterClient[id] = new twitter({
      consumer_key: "ywPwAvJmU3by3asRWQGu0WJOh",
      consumer_secret: "Gr3cI0n66C1CWpBG732ATHpsb0AebDAZZ2xGOKpkFevnY2RJlS",
      access_token_key: key,
      access_token_secret: secret_key
    });
    twitterClient[id].get('account/verify_credentials', function(error, twit_data) {
      var _res = false;
      if(error) {
        socialClients.twitter = undefined;
        delete twitterClient[id];
        Author.upsert({
          id: id,
          twitter: null
        });
      } else socialClients.twitter = _res = twit_data.screen_name;
      cb(_res);
    });
  };

  Author.connect = function(id, provider, params, cb) {  
    if(socialClients.hasOwnProperty(provider)) {
      var query = {
        id: id
      };
      query[provider] = params
      Author.upsert(query, function(err, instance) {
        if(!err) {
          switch(provider) {
            case "twitter":
            twitterConnect(id, params.twitter_key, params.twitter_secret_key, function(_res) {
              _res ? cb(null, _res) : cb("Twitter connect problem.");
            });
            break;
            default:
              cb("Provider not found");
            break;
          }
        } else {
          cb("Insert tokens problem");
        }
      });
    } else cb("Provider not found");
  };
  Author.remoteMethod(
    'connect',
    {
      description: 'Connect your social network. With OAuth.io.',
      http: {path: '/:id/connect', verb: 'post'},
      accepts: [
        {arg: 'id', type: 'number', required: true, http: {source: 'path'}},
        {arg: 'provider', type: 'string', required: true},
        {arg: 'params', type: 'object', required: true}],
      returns: {arg: 'connected', type: 'string'}
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
          if(data.twitter) {
            twitterConnect(id, data.twitter.twitter_key,data.twitter.twitter_secret_key, function(_res) {
              cb(null, _res);
            });
          } else {
            socialClients.twitter = undefined;
            delete twitterClient[id];
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
      var params = {id: id};
      params[provider] = null;
      Author.upsert(params, function(err, instance) {
        if(err) cb(err); else {
          var name = "";
          switch(provider) {
            case "twitter":
              name = socialClients.twitter;
              socialClients.twitter = undefined;
              delete twitterClient[id];
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
          if(res.socials[key]==="twitter" && twitterClient[res.authorId]) {
            twitterClient[res.authorId].post('statuses/update', {status: res.text}, function(err, tweet, _res) {
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
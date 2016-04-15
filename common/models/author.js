
module.exports = function(Author) {
  var async = require('async'),
  twitter = require('twitter'),
  facebook = require('fb');

/*  Start socials service  */
  var socials = (function() {
    var priv = {
      enabled: [],
      credentials: {},
      api: {
        twitter: function() {
          this.sdk = null;
        },
        facebook: function() {
          this.access_token = "";
        },
        users: {}
      }
    };
    priv.api.twitter.prototype.connect = function(params, cb) {
      this.sdk = new twitter({
        consumer_key: priv.credentials.twitter.consumer_key,
        consumer_secret: priv.credentials.twitter.consumer_secret,
        access_token_key: params.access_token_key,
        access_token_secret: params.access_token_secret
      });
      this.sdk.get('account/verify_credentials', function(error, twit_data) {
        error ? cb(error) : cb(null, {
          id: twit_data.screen_name,
          name: twit_data.name
        });
      });
    };
    priv.api.twitter.prototype.send = function(text, cb) {
      /*_this.sdk.post('statuses/update', {status: text}, function(err, tweet, _res) {
        err ? cb(null, false) : cb(null, true);
      });*/
      this.sdk.get('account/verify_credentials', function(error, twit_data) {
        error ? cb(error) : cb(null, twit_data.screen_name);
      });
    };
    priv.api.facebook.prototype.connect = function(params, cb) {
      this.access_token = params.access_token;
      facebook.setAccessToken(this.access_token);
      facebook.api('me', function (res) {
        !res || res.error ?
          cb(!res ? 'error occurred' : res.error) :
          cb(null, res);
      });
    };
    priv.api.facebook.prototype.send = function(text, cb) {
      facebook.setAccessToken(this.access_token);
      facebook.api('me/feed', 'post', {message: text}, function (res) {
        !res || res.error ?
          cb(!res ? 'error occurred' : res.error) :
          cb(null, true);
      });
    };
    var pub = {
      setCredentials: function(credentials) {
        priv.credentials = credentials;
        for(var _provider in credentials)
          priv.enabled.push(_provider);
      },
      enabled: function(provider) {
        return provider ? priv.enabled.indexOf(provider)!==-1 ? true : false : priv.enabled; 
      },
      connected: {},
      api: function(id, provider) {
        var _this = {};
        _this.connect = function(params, cb) {
          if(!pub.connected[id]) {
            priv.api.users[id] = {};
            pub.connected[id] = {};
            priv.enabled.forEach(function(e){
              pub.connected[id][e] = false;
            });
          } else pub.connected[id][provider] = false;
          if(!params) cb(null, false); {
            priv.api.users[id][provider] = new priv.api[provider];
            priv.api.users[id][provider].connect(params, function(err, res) {
              if(!err) {
                pub.connected[id][provider] = res;
                if(params.notupdate) cb(null, res); else {
                  var query = {};
                  query[provider] = params;
                  Author.update({id:id}, query, function(err) {
                    err ? cb(err) : cb(null, res);
                  });
                }
              } else cb(err);
            });
          }
        }
        _this.disconnect = function(cb){
          var query = {};
          query[provider] = null;
          Author.update({id:id}, query, function(err, res) {
            if(err) cb(err); else {
              var name = pub.connected[id][provider];
              pub.connected[id][provider] = false;
              delete priv.api.users[id][provider];
              cb(null, name);
            }
          });
        };
        _this.send = function(msg, cb){
          priv.api.users[id] && priv.api.users[id][provider] ?
            priv.api.users[id][provider].send(msg, cb) :
            pub.api(id).isConnected(function(err, res) {
              err ? cb(err) :
                res[provider] ?
                  priv.api.users[id][provider].send(msg, cb) :
                  cb("NOT_CONNECTED");
            });
        };
        _this.isConnected = function(cb) {
          Author.findById(id, function(err, data) {
            if(err) cb(err); else {
              var _providers = {};
              priv.enabled.forEach(function(_provider) {
                _providers[_provider] = async.apply(function(cb){
                  if(data[_provider]) {
                    data[_provider].notupdate = true;
                    pub.api(id, _provider).connect(data[_provider], function(err, res) {
                      if(err) {
                        var query = {};
                        query[_provider] = null;
                        Author.update({id:id}, query);
                        cb(null, false);
                      } else cb(null, res);
                    });
                  } else cb(null, false);
                });
              });
              async.parallel(_providers, function(err, res) {
                pub.connected[id] = res;
                cb(err, res);
              });
            }
          });
        };
        _this.logout = function() {
          delete pub.connected[id];
          delete priv.api.users[id];
        }

        id && provider ?
          _res = {
            connect: _this.connect,
            disconnect: _this.disconnect,
            send: _this.send
          } : id ? 
          _res = {
            isConnected: _this.isConnected,
            logout: _this.logout
          } : 
          _res = false;

        return _res;
      }
    };

    return {
      setCredentials: pub.setCredentials,
      enabled: pub.enabled,
      connected: pub.connected,
      api: pub.api
    };
  })();

  /*  End socials service  */

  socials.setCredentials({
    twitter: {
      consumer_key: "ywPwAvJmU3by3asRWQGu0WJOh",
      consumer_secret: "Gr3cI0n66C1CWpBG732ATHpsb0AebDAZZ2xGOKpkFevnY2RJlS",
    },
    facebook: {}
  });

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

  Author.connect = function(id, provider, params, cb) {  
    socials.enabled().indexOf(provider) === -1 ? cb("PROVIDER_NOT_FOUND") : socials.api(id, provider).connect(params, cb);
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
    socials.api(id).isConnected(cb);
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
    socials.connected[id] && socials.connected[id][provider] ?
      socials.api(id, provider).disconnect(cb) :
      socials.api(id).isConnected(function(err, res) {
        err ? cb(err) :
          res[provider] ?
            socials.api(id, provider).disconnect(cb) :
            cb("NOT_CONNECTED");
      });
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
    socials.api(res.userId).isConnected(function(err, _res) {
      err ? res.socials = err : res.socials = _res;
      next();
    });
  });

  Author.afterRemote('**.__create__posts', function(context, res, next) {
    if(res && res.socials.length) {
      var _providers = {};
      res.socials.forEach(function(_provider) {
        _providers[_provider] = async.apply(function(cb) {
          if(socials.enabled(_provider)) {
            socials.api(res.authorId, _provider).send(res.text, function(err, _res) {
              cb(null, {error: err, success: _res});
            });
          } else cb(null, "PROVIDER_NOT_FOUND");
        });
      });
      async.parallel(_providers, function(err, _res) {
        res.send_socials = _res;
        for(var key in _res)
          if(_res[key].error) res.socials.splice(res.socials.indexOf(key),1);
        next();
      });
    } else next();
  });

  Author.beforeRemote('logout', function(context, res, next) {
    socials.api(context.req.accessToken.userId).logout();
    next();
  });
};
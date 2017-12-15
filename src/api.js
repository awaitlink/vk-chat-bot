const request = require('request');

const Log = require('./log.js');
log = new Log();

var apiKey = null;

exports.setKey = function(key) {
  apiKey = key;
};

exports.send = function(uid, msg) {
  if (!apiKey){
    log.log(log.type.response, 'Send error: no API key set.');
    return false;
  }

  // At this point the test can be considered as successful
  if (apiKey == 'test') {
    return true;
  }

  var url = `https://api.vk.com/method/messages.send?user_id=${uid}&message=${encodeURIComponent(msg)}&access_token=${apiKey}`;

  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200){
      log.log(log.type.response, 'Message sent to user: ' + uid + '.');
    }

    if (error){
      log.log(log.type.error, 'Error occured when sending a message: ' + error);
    }
  });
};

const request = require('request');

const log = new (require('./log.js'))();

class API {
  constructor(vkApiKey) {
    this.vkApiKey = vkApiKey;
  }

  send(uid, msg) {
    var url = `https://api.vk.com/method/messages.send?user_id=${uid}&message=${encodeURIComponent(msg)}&access_token=${this.vkApiKey}`;

    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200){
        log.log(log.type.response, 'Message sent to user: ' + uid + '.');
      }

      if (error){
        log.log(log.type.error, 'Error occured when sending a message: ' + error);
      }
    });
  }
}

module.exports = API;

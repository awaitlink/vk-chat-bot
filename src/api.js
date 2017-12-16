const request = require('request');

const log = new (require('./log.js'))();

class API {
  constructor(vkApiKey) {
    this.vkApiKey = vkApiKey;
  }

  call(method, params) {
    var method = encodeURIComponent(method);
    var url = `https://api.vk.com/method/${method}?access_token=${this.vkApiKey}`;

    Object.keys(params).map(e => {
      var name = encodeURIComponent(e);
      var value = encodeURIComponent(params[e]);

      url += `&${name}=${value}`;
    });

    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200){
        log.log(log.type.response, `VK API call to ${method} succeeded`);
      } else {
        log.log(log.type.error, `Error (${error}) occured when calling ${method}. Response: ${response}`);
      }
    });
  }

  send(uid, msg) {
    this.call("messages.send", {user_id: uid, message: msg});
  }
}

module.exports = API;

const request = require('request-promise')

const log = new (require('./log.js'))()

class API {
  constructor (vkApiKey) {
    this.vkApiKey = vkApiKey
  }

  call (method, params) {
    method = encodeURIComponent(method)
    var url = `https://api.vk.com/method/${method}?access_token=${this.vkApiKey}`

    Object.keys(params).map(e => {
      var name = encodeURIComponent(e)
      var value = encodeURIComponent(params[e])

      url += `&${name}=${value}`
    })

    var options = {
      uri: url,
      json: true
    }

    var promise = request(options)
    promise.catch((err) => {
      log.log(log.type.error, `Error occured when calling ${method}: ${err}`)
    })

    return promise
  }

  send (uid, msg) {
    this.call('messages.send', {user_id: uid, message: msg})
      .then((body) => {
        log.log(log.type.response, `Sent a message to user ${uid}.`)
      })
  }
}

module.exports = API

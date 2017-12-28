const request = require('request-promise')

const log = new (require('./log.js'))()

class API {
  constructor (vkApiKey) {
    this.vkApiKey = vkApiKey
    this.API_QUOTA = 20

    this.queue = []
    setInterval(() => {
      if (this.queue.length > 0) {
        var e = this.queue.shift()

        this.call(e.method, e.params)
          .then((json) => {
            e.callback(json)
          })
      }
    }, 1000 / this.API_QUOTA)
  }

  scheduleCall (method, params, callback) {
    this.queue.push({
      method: method,
      params: params,
      callback: callback
    })
  }

  call (method, params) {
    method = encodeURIComponent(method)
    var url = `https://api.vk.com/method/${method}?access_token=${this.vkApiKey}`

    Object.keys(params).map(e => {
      var name = encodeURIComponent(e)
      var value = encodeURIComponent(params[e])

      if (!value) value = ''

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

  send (uid, msg, attachment) {
    var params = {
      user_id: uid,
      message: msg,
      attachment: attachment
    }

    this.scheduleCall('messages.send', params, (json) => {
      log.log(log.type.response, `Sent a message to user ${uid}.`)
    })
  }
}

module.exports = API

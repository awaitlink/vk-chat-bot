const request = require('request-promise')

const log = new (require('./log.js'))()

class API {
  constructor (vkApiKey) {
    log.requireParams('API.constructor', vkApiKey)

    this.vkApiKey = vkApiKey
    this.isInTestMode = vkApiKey === 'test'

    this.API_VERSION = 5.69
    this.API_QUOTA = 20

    this.queue = []
    if (!this.isInTestMode) {
      setInterval(this.processQueue, 1000 / this.API_QUOTA)
    }
  }

  processQueue () {
    if (this.queue.length > 0) {
      var e = this.queue.shift()

      this.call(e.method, e.params)
        .then((json) => {
          if (e.callback) {
            e.callback(json)
          }
        })
    }
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
    var url = `https://api.vk.com/method/${method}?access_token=${this.vkApiKey}&v=${this.API_VERSION}`

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

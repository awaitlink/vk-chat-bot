const request = require('request-promise')
const log = new (require('./log.js'))()

class API {
  constructor (vkApiKey) {
    log.requireParams('API.constructor', vkApiKey)

    this.vkApiKey = vkApiKey
    this.isInTestMode = vkApiKey === 'test'

    this.API_VERSION = '5.80'
    this.API_QUOTA = 20

    this.queue = []
    if (!this.isInTestMode) {
      // Check permissions
      this.checkPermissions()

      // Start the queue processing
      setInterval(() => {
        this.processQueue()
      }, 1000 / this.API_QUOTA)
    }
  }

  checkPermissions () {
    // Check if the token has the required permissions
    this.scheduleCall('groups.getTokenPermissions', {}, json => {
      var permissions = json.response.permissions
      var ok = false
      for (var permission of permissions) {
        if (permission.name === 'messages') {
          ok = true
          break
        }
      }

      if (!ok) {
        log.log(log.type.error, 'Token permission "messages" is missing. Bot will be unable to send any messages.')
      } else {
        log.log(log.type.information, 'Token permission "messages" is present.')
      }
    })
  }

  processQueue () {
    if (this.queue && this.queue.length > 0) {
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
    var url = `https://api.vk.com/method/${method}`

    var options = {
      uri: url,
      json: true,
      qs: {
        access_token: this.vkApiKey,
        v: this.API_VERSION
      }
    }

    Object.keys(params).map(e => { options.qs[e] = params[e] })

    var promise = request(options)

    promise.catch((err) => {
      log.log(log.type.error, `Error occured when calling ${method}: ${err}`)
    })

    return promise
  }

  send (pid, msg, attachment) {
    var params = {
      peer_id: pid,
      message: msg,
      attachment: attachment
    }

    this.scheduleCall('messages.send', params, (json) => {
      log.log(log.type.response, `Sent a message to peer ${pid}.`)
    })
  }
}

module.exports = API

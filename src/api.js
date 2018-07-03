const request = require('request-promise')
const log = new (require('./log.js'))()

class API {
  constructor (vkToken, stats) {
    log.requireParam('API.constructor', vkToken, 'VK API token')
    log.requireParam('API.constructor', stats, 'statistics object')

    this.vkToken = vkToken
    this.isInTestMode = vkToken === 'test'

    this.stats = stats

    this.API_VERSION = '5.80'
    this.API_QUOTA = 20

    this.queue = []
    if (!this.isInTestMode) {
      // Check permissions
      this.checkPermissions()

      // Start the queue processing
      setInterval(() => {
        this.processQueue()
      }, 1000)
    }
  }

  checkPermissions () {
    // Check if the token has the required permissions
    this.scheduleCall('groups.getTokenPermissions', {}, json => {
      if (!json.response) {
        log.error(`While checking token permission "messages", an error occured: ${json.error}`)
      }

      var permissions = json.response.permissions
      var ok = false
      for (var permission of permissions) {
        if (permission.name === 'messages') {
          ok = true
          break
        }
      }

      if (!ok) {
        log.warn('Token permission "messages" is missing. Bot will be unable to send any messages.')
      } else {
        log.info('Token permission "messages" is present.')
      }
    })
  }

  processQueue () {
    if (this.queue) {
      for (var i = 1; i <= this.API_QUOTA; i++) {
        if (this.queue.length === 0) {
          break
        }

        var e = this.queue.shift()

        this.call(e.method, e.params)
          .then((json) => {
            if (e.callback) {
              e.callback(json)
            }
          })
      }
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
        access_token: this.vkToken,
        v: this.API_VERSION
      }
    }

    Object.keys(params).map(e => { options.qs[e] = params[e] })

    var promise = request(options)

    promise.catch((err) => {
      log.warn(`Error occured while calling API method '${method}': ${err}`)
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
      if (json.response) {
        this.stats.sent()
      } else {
        if (json.error) {
          var errorCode = json.error.error_code
          var errorMsg = json.error.error_msg

          log.warn(`A message was not sent to peer ${pid} due to an API error #${errorCode}: ${errorMsg}`)
        } else {
          log.warn(`A message was not sent to peer ${pid} due to an unknown API error. The API responded with: ${json.toString()}`)
        }
      }
    })
  }
}

module.exports = API

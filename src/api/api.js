const request = require('request-promise')
const log = new (require('../extra/log'))()

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
        .then(e => {
          log.info(e)
        })
        .catch(e => {
          log.warn(e)
        })

      // Start the queue processing
      setInterval(() => {
        this.processQueue()
          .catch(e => {
            log.warn(e)
          })
      }, 1000)
    }
  }

  async checkPermissions () {
    // Check if the token has the required permissions
    var response = await this.scheduleCall('groups.getTokenPermissions', {})

    var permissions = response.permissions
    var ok = false
    for (var permission of permissions) {
      if (permission.name === 'messages') {
        ok = true
        break
      }
    }

    if (!ok) {
      return Promise.reject(new Error('Token permission "messages" is missing. Bot will be unable to send any messages.'))
    } else {
      return Promise.resolve('Token permission "messages" is present.')
    }
  }

  async processQueue () {
    if (this.queue) {
      for (var i = 1; i <= this.API_QUOTA; i++) {
        if (this.queue.length === 0) {
          break
        }

        var e = this.queue.shift()

        var json = await this.call(e.method, e.params)

        if (json.response !== undefined && json.response !== null) {
          e.resolve(json.response)
        } else {
          if (json.error) {
            var errorCode = json.error.error_code
            var errorMsg = json.error.error_msg

            e.reject(`An API call to method '${e.method}' failed due to an API error #${errorCode}: ${errorMsg}`)
          } else {
            e.reject(`An API call to method '${e.method}' failed due to an unknown API error. The API responded with: ${JSON.stringify(json)}`)
          }
        }
      }

      return Promise.resolve()
    }

    return Promise.reject(new Error('No queue for API calls found'))
  }

  async scheduleCall (method, params) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        method: method,
        params: params,
        resolve: resolve,
        reject: reject
      })
    })
  }

  async call (method, params) {
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

  async send (pid, msg, attachment) {
    var params = {
      peer_id: pid,
      message: msg,
      attachment: attachment
    }

    return new Promise((resolve, reject) => {
      this.scheduleCall('messages.send', params)
        .then(_ => {
          this.stats.sent()
          resolve()
        })
        .catch(e => {
          log.warn(e)
          resolve()
        })
    })
  }
}

module.exports = API

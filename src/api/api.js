import {info, warn, requireParam} from '../extra/log'
import '@babel/polyfill'
const request = require('request-promise')

export default class API {
  constructor (vkToken, stats) {
    requireParam('API.constructor', vkToken, 'VK API token')
    requireParam('API.constructor', stats, 'statistics object')

    this.vkToken = vkToken
    this.stats = stats

    this.API_VERSION = '5.80'
    this.API_QUOTA = 20

    this.queue = []
    if (!process.env.TEST_MODE) {
      // Check permissions
      this.checkPermissions()
        .then(e => {
          info(e)
        })
        .catch(e => {
          warn(e)
        })

      // Start the queue processing
      setInterval(() => {
        this.processQueue()
          .catch(e => {
            warn(e)
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
      warn(`Error occured while calling API method '${method}': ${err}`)
    })

    return promise
  }

  async send (pid, message, attachment, keyboard) {
    var params = {
      peer_id: pid
    }

    if (message) params.message = message
    if (attachment) params.attachment = attachment
    if (keyboard) params.keyboard = keyboard

    return new Promise((resolve, reject) => {
      this.scheduleCall('messages.send', params)
        .then(_ => {
          this.stats.sent()
          resolve()
        })
        .catch(e => {
          warn(e)
          resolve()
        })
    })
  }
}

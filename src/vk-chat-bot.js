const app = require('express')()
const bodyParser = require('body-parser')

const Behavior = require('./behavior.js')
const log = new (require('./log.js'))()

class ChatBot {
  constructor (params) {
    log.requireParams('ChatBot.constructor', params)
    log.requireParams('ChatBot.constructor', params.group_id, params.confirmation_token, params.secret, params.vk_api_key)

    this.groupId = params.group_id.toString()
    this.confirmationToken = params.confirmation_token.toString()
    this.secret = params.secret.toString()

    var vkApiKey = params.vk_api_key.toString()
    var cmdPrefix = !params ? '' : params.cmd_prefix.toString()

    this.behavior = new Behavior(vkApiKey, cmdPrefix)
  }

  cmd (command, a, b) { this.behavior.cmd(command, a, b) }
  regex (regex, callback) { this.behavior.regex(regex, callback) }
  on (e, callback) { this.behavior.on(e, callback) }

  help () { return this.behavior.help() }

  start (port) {
    log.requireParams('ChatBot.start', port)

    app.use(bodyParser.json())

    app.get('/', (req, res) => {
      res.status(400).send('Only POST allowed.')
      log.log(log.type.request, 'GET request.')
    })

    app.post('/', (req, res) => {
      var body = req.body

      if (body.secret !== this.secret) {
        res.status(400).send('Invalid secret key.')
        log.log(log.type.request, 'Request with an invalid secret key.')
        return
      }

      if (body.group_id.toString() !== this.groupId) {
        res.status(400).send('Invalid group id.')
        log.log(log.type.request, 'Request with an invalid group id.')
        return
      }

      if (body.type === 'confirmation') {
        res.status(200).send(this.confirmationToken)
        log.log(log.type.response, 'Sent confirmation token.')
      } else {
        res.status(200).send('ok')
        this.behavior.parseRequest(body)
      }
    })

    var server = app.listen(port, (err) => {
      if (err) {
        log.error('Error: ' + err)
      }

      log.log(log.type.information, `Server is listening on port ${port}.`)

      // Quit in test mode
      if (this.behavior.isInTestMode) {
        log.log(log.type.information, `Stopping the server because in test mode.`)
        server.close()
      }
    })
  }
}

module.exports = ChatBot

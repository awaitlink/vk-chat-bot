const app = require('express')()
const bodyParser = require('body-parser')

const Behavior = require('./behavior.js')
const log = new (require('./log.js'))()

class ChatBot {
  constructor (params) {
    log.requireParams('ChatBot.constructor', params)

    this.groupId = params.group_id.toString()
    this.confirmationToken = params.confirmation_token.toString()
    this.secret = params.secret.toString()

    this.behavior = new Behavior(params.vk_api_key.toString(), params.cmd_prefix.toString())

    log.requireParams('ChatBot.constructor', this.groupId, this.confirmationToken, this.secret, this.behavior)
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
        log.log(log.type.error, 'Error: ' + err)
        log.terminate()
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

const app = require('express')()
const bodyParser = require('body-parser')

const Behavior = require('./behavior.js')
const log = new (require('./log.js'))()

class ChatBot {
  constructor (params) {
    if (!params) {
      log.badParams('constructor')
    }

    this.groupId = params.group_id
    this.confirmationToken = params.confirmation_token
    this.secret = params.secret

    this.behavior = new Behavior(params.vk_api_key, params.cmd_prefix)

    if (!(this.groupId && this.confirmationToken && this.secret && this.behavior)) {
      log.badParams('constructor')
    }
  }

  cmd (command, a, b) { this.behavior.cmd(command, a, b) }
  regex (regex, callback) { this.behavior.regex(regex, callback) }
  on (e, callback) { this.behavior.on(e, callback) }

  help () { return this.behavior.help() }

  start (port) {
    if (!port) {
      log.badParams('start')
    }

    app.use(bodyParser.json())

    app.get('/', (req, res) => {
      res.status(400).send('Only POST allowed.')
      log.log(log.type.request, 'GET request.')
    })

    app.post('/', (req, res) => {
      var body = req.body

      if (body.type === 'confirmation' && body.group_id === this.groupId) {
        res.status(200).send(this.confirmationToken)
      } else if (body.secret === this.secret) {
        res.status(200).send('ok')
        this.behavior.parseRequest(body)
      } else {
        res.status(400).send('Invalid secret key.')
        log.log(log.type.request, 'Request with an invalid secret key.')
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

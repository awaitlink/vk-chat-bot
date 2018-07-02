const app = require('express')()
const bodyParser = require('body-parser')

const Behavior = require('./behavior.js')
const log = new (require('./log.js'))()

class ChatBot {
  constructor (params) {
    log.requireParam('ChatBot.constructor', params, 'parameters for the bot')
    log.requireParam('ChatBot.constructor', params.vk_token, 'VK API token')
    log.requireParam('ChatBot.constructor', params.confirmation_token, 'confirmation token (from Callback API settings)')
    log.requireParam('ChatBot.constructor', params.group_id, 'group id')
    log.requireParam('ChatBot.constructor', params.secret, 'secret key (from Callback API settings)')

    this.groupId = params.group_id.toString()
    this.confirmationToken = params.confirmation_token.toString()
    this.secret = params.secret.toString()

    var vkToken = params.vk_token.toString()
    var cmdPrefix = params.cmd_prefix ? params.cmd_prefix.toString() : ''

    this.behavior = new Behavior(vkToken, cmdPrefix)
  }

  noEventWarnings () { this.behavior.noEventWarnings = true }
  cmd (command, callback, description) { this.behavior.cmd(command, callback, description) }
  regex (regex, callback) { this.behavior.regex(regex, callback) }
  on (e, callback) { this.behavior.on(e, callback) }

  help () { return this.behavior.help() }

  start (port) {
    log.requireParam('ChatBot.start', port, 'port')

    this.behavior.lock()

    var eventCount = this.behavior.eventHandlers.length
    var commandCount = this.behavior.commandHandlers.length
    var regexCount = this.behavior.regexHandlers.length
    log.info(`Using ${eventCount} event, ${commandCount} command, and ${regexCount} regex handlers.`)

    if ((eventCount + commandCount + regexCount) === 0) {
      log.warn(`The bot won't do anything without handlers!`)
    }

    log.progress(`Preparing the server...`)

    app.use(bodyParser.json())

    app.get('/', (req, res) => {
      res.status(400).send('Only POST allowed.')
      log.warn('GET request received.')
    })

    app.post('/', (req, res) => {
      var body = req.body

      if (body.secret !== this.secret) {
        res.status(400).send('Invalid secret key.')
        log.warn('Request with an invalid secret key.')
        return
      }

      if (body.group_id.toString() !== this.groupId) {
        res.status(400).send('Invalid group id.')
        log.warn('Request with an invalid group id.')
        return
      }

      if (body.type === 'confirmation') {
        res.status(200).send(this.confirmationToken)
        log.res('Sent confirmation token.')
      } else {
        res.status(200).send('ok')
        this.behavior.parseRequest(body)
      }
    })

    log.progress('Starting the server...')

    var server = app.listen(port, (err) => {
      if (err) {
        log.error('Error occured while starting the server: ' + err)
      }

      log.info(`Server is listening on port ${port}.`)

      // Quit in test mode
      if (this.behavior.isInTestMode) {
        log.info(`Stopping the server because in test mode.`)
        server.close()
      }
    })
  }
}

module.exports = ChatBot

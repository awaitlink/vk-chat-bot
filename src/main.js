import {info, progress, response, warn, error, requireParam} from './extra/log'
import Core from './core'
const express = require('express')
const bodyParser = require('body-parser')

export default class ChatBot {
  constructor (params) {
    requireParam('ChatBot.constructor', params, 'parameters for the bot')
    requireParam('ChatBot.constructor', params.vk_token, 'VK API token')
    requireParam('ChatBot.constructor', params.confirmation_token, 'confirmation token (from Callback API settings)')
    requireParam('ChatBot.constructor', params.group_id, 'group id')
    requireParam('ChatBot.constructor', params.secret, 'secret key (from Callback API settings)')

    this.groupId = params.group_id.toString()
    this.confirmationToken = params.confirmation_token.toString()
    this.secret = params.secret.toString()

    var vkToken = params.vk_token.toString()
    var cmdPrefix = params.cmd_prefix ? params.cmd_prefix.toString() : ''

    this.core = new Core(vkToken, cmdPrefix)
  }

  noEventWarnings () {
    this.core.noEventWarnings = true
    warn('Warnings about "no matching event ... handler found" were disabled')
  }

  on (e, callback) { this.core.on(e, callback) }
  cmd (command, callback, description) { this.core.cmd(command, callback, description) }
  regex (regex, callback) { this.core.regex(regex, callback) }

  help () { return this.core.help() }

  start (port) {
    requireParam('ChatBot.start', port, 'port')

    this.core.lock()

    var eventCount = this.core.eventHandlers.length
    var commandCount = this.core.commandHandlers.length
    var regexCount = this.core.regexHandlers.length
    info(`Using ${eventCount} event, ${commandCount} command, and ${regexCount} regex handlers.`)

    if ((eventCount + commandCount + regexCount) === 0) {
      warn(`The bot won't do anything without handlers!`)
    }

    progress(`Preparing the server...`)

    const app = express()

    app.use(bodyParser.json())

    app.get('/', (req, res) => {
      res.status(400).send('Only POST allowed.')
      warn('GET request received.')
    })

    app.post('/', (req, res) => {
      var body = req.body

      if (body.secret !== this.secret) {
        res.status(400).send('Invalid secret key.')
        warn('Request with an invalid secret key.')
        return
      }

      if (body.group_id.toString() !== this.groupId) {
        res.status(400).send('Invalid group id.')
        warn('Request with an invalid group id.')
        return
      }

      if (body.type === 'confirmation') {
        res.status(200).send(this.confirmationToken)
        response('Sent confirmation token.')
      } else {
        res.status(200).send('ok')
        this.core.parseRequest(body)
      }
    })

    progress('Starting the server...')

    var server = app.listen(port, (err) => {
      if (err) {
        error('Error occured while starting the server: ' + err)
      }

      info(`Server is listening on port ${port}.`)

      // Quit in test mode
      if (process.env.TEST_MODE) {
        server.close()
      }
    })
  }
}

import {info, progress, res as response, warn, err as error, requireParam} from './extra/log'
const express = require('express')
const bodyParser = require('body-parser')

export default class Bot {
  constructor (core, groupId, confirmationToken, secret, port) {
    requireParam('Bot#constructor', core, 'bot core')
    requireParam('Bot#constructor', confirmationToken, 'confirmation token (from Callback API settings)')
    requireParam('Bot#constructor', groupId, 'group id')
    requireParam('Bot#constructor', secret, 'secret key (from Callback API settings)')
    requireParam('Bot#constructor', port, 'port')

    this.core = core

    this.groupId = groupId
    this.confirmationToken = confirmationToken
    this.secret = secret
    this.port = port
  }

  start () {
    this.core.lock()

    var eventCount = this.core.eventCount
    var commandCount = this.core.commandHandlers.length
    var regexCount = this.core.regexHandlers.length
    info(`Using ${eventCount} event, ${commandCount} command, and ${regexCount} regex handlers`)

    if ((eventCount + commandCount + regexCount) === 0) {
      warn(`The bot won't do anything without handlers!`)
    }

    progress(`Preparing and starting the server...`)

    const app = express()

    app.use(bodyParser.json())

    app.get('/', (req, res) => {
      res.status(400).send('Only POST allowed.')
      warn('GET request received')
    })

    app.post('/', (req, res) => {
      var body = req.body

      if (body.secret !== this.secret) {
        res.status(400).send('Invalid secret key.')
        warn('Request with an invalid secret key')
        return
      }

      if (body.group_id.toString() !== this.groupId) {
        res.status(400).send('Invalid group id.')
        warn('Request with an invalid group id')
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

    var server = app.listen(this.port, (err) => {
      if (err) {
        error('Error occured while starting the server: ' + err)
      }

      info(`Server is listening on port ${this.port}`)

      // Quit in test mode
      if (process.env.TEST_MODE) {
        server.close()
      }
    })
  }
}

/**
 * @file A part of `vk-chat-bot` node.js framework
 * @author Artem Varaksa <aymfst@gmail.com>
 * @copyright Artem Varaksa 2017-2018
 */

/**
 * @module bot
 */

import { info, res as response, warn, err as error, requireParam } from './extra/log'
const express = require('express')
const bodyParser = require('body-parser')

export default class Bot {
  /**
   * @constructor Bot
   *
   * @return {Bot}
   *
   * @param {Core} core - a `Core` object
   * @param {string|number} groupId - group ID from Callback API settings
   * @param {string} confirmationToken - confirmation token from Callback API settings
   * @param {string} secret - secret key (can be set in Callback API settings)
   * @param {number} port - the port bot will run at
   *
   * @classdesc
   * The `Bot` class responds to incoming events from Callback API,
   * and figures out what needs to be done.
   */
  constructor (core, groupId, confirmationToken, secret, port) {
    requireParam('Bot#constructor', core, 'bot core')
    requireParam('Bot#constructor', confirmationToken, 'confirmation token (from Callback API settings)')
    requireParam('Bot#constructor', groupId, 'group id')
    requireParam('Bot#constructor', secret, 'secret key (from Callback API settings)')
    requireParam('Bot#constructor', port, 'port')

    /**
     * Core
     *
     * @private
     * @type {Core}
     * @memberof module:bot~Bot
     */
    this.core = core

    /**
     * Group ID
     *
     * @private
     * @type {string|number}
     * @memberof module:bot~Bot
     */
    this.groupId = groupId

    /**
     * Confirmation token
     *
     * @private
     * @type {string}
     * @memberof module:bot~Bot
     */
    this.confirmationToken = confirmationToken

    /**
     * Secret
     * @private
     * @type {string}
     * @memberof module:bot~Bot
     */
    this.secret = secret

    /**
     * Port
     *
     * @private
     * @type {number}
     * @memberof module:bot~Bot
     */
    this.port = port
  }

  /**
   * Starts the bot
   * @instance
   * @memberof module:bot~Bot
   */
  start () {
    this.core.lock()

    var evt = this.core.eventCount
    var pld = this.core.payloadCount
    var cmd = this.core.commandHandlers.length
    var reg = this.core.regexHandlers.length
    info('bot', `Handlers count: on:${evt} cmd:${cmd} regex:${reg} payload:${pld}`)

    if ((evt + cmd + reg + pld) === 0) {
      warn('bot', `The bot won't do anything without handlers!`)
    }

    info('bot', `Preparing and starting the server...`)

    const app = express()

    app.use(bodyParser.json())

    app.get('/', (req, res) => {
      res.status(400).send('Only POST allowed.')
      warn('bot', 'Received a GET request')
    })

    app.post('/', (req, res) => {
      var body = req.body

      if (body.secret !== this.secret) {
        res.status(400).send('Invalid secret key.')
        warn('bot', 'Received a request with an invalid secret key')
        return
      }

      if (body.group_id.toString() !== this.groupId) {
        res.status(400).send('Invalid group id.')
        warn('bot', 'Received a request with an invalid group id')
        return
      }

      if (body.type === 'confirmation') {
        res.status(200).send(this.confirmationToken)
        response('bot', 'Sent confirmation token.')
      } else {
        res.status(200).send('ok')
        this.core.parseRequest(body)
      }
    })

    var server = app.listen(this.port, (err) => {
      if (err) {
        error('bot', 'Error occured while starting the server: ' + err)
      }

      info('bot', `Server is listening on port ${this.port}`)

      // Quit in test mode
      if (process.env.TEST_MODE) {
        server.close()
      }
    })
  }
}

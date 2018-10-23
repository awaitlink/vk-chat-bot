/**
 * @file A part of `vk-chat-bot` node.js framework.
 * Defines the {@link Bot} class.
 *
 * @author Artem Varaksa <aymfst@gmail.com>
 * @copyright Artem Varaksa 2017-2018
 */

import { log, requireParam } from './extra/log'
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
     * @memberof Bot
     */
    this._core = core

    /**
     * Group ID
     *
     * @private
     * @type {string|number}
     * @memberof Bot
     */
    this._groupId = groupId

    /**
     * Confirmation token
     *
     * @private
     * @type {string}
     * @memberof Bot
     */
    this._confirmationToken = confirmationToken

    /**
     * Secret
     * @private
     * @type {string}
     * @memberof Bot
     */
    this._secret = secret

    /**
     * Port
     *
     * @private
     * @type {number}
     * @memberof Bot
     */
    this._port = port
  }

  /**
   * Starts the bot
   * @instance
   * @memberof Bot
   */
  start () {
    this._core.lock()

    var evt = Object.values(this._core._eventHandlers).filter(e => e).length - 1 // Do not count `message_new`
    var pld = Object.keys(this._core._exactPayloadHandlers).length +
              this._core._dynPayloadHandlers.length
    var cmd = this._core._commandHandlers.length
    var reg = this._core._regexHandlers.length
    log().i(`Handlers count: on:${evt} cmd:${cmd} regex:${reg} payload:${pld}`).from('bot').now()

    if ((evt + cmd + reg + pld) === 0) {
      log().w(`The bot won't do anything without handlers!`).from('bot').now()
    }

    log().i(`Preparing and starting the server...`).from('bot').now()

    const app = express()

    app.use(bodyParser.json())

    app.get('/', (req, res) => {
      res.status(400).send('Only POST allowed.')
      log().w('Received a GET request').from('bot').now()
    })

    app.post('/', (req, res) => {
      var body = req.body

      if (body.secret !== this._secret) {
        res.status(400).send('Invalid secret key.')
        log().w('Received a request with an invalid secret key').from('bot').now()
        return
      }

      if (body.group_id.toString() !== this._groupId) {
        res.status(400).send('Invalid group id.')
        log().w('Received a request with an invalid group id').from('bot').now()
        return
      }

      if (body.type === 'confirmation') {
        res.status(200).send(this._confirmationToken)
        log().r('Sent confirmation token.').from('bot').now()
      } else {
        res.status(200).send('ok')
        this._core.parseRequest(body)
      }
    })

    var server = app.listen(this._port, (err) => {
      if (err) {
        log().e('Error occured while starting the server: ' + err).from('bot').now()
      }

      log().i(`Server is listening on port ${this._port}`).from('bot').now()

      // Quit in test mode
      if (process.env.TEST_MODE) {
        server.close()
      }
    })
  }
}

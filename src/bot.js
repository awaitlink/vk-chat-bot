/**
 * @file A part of `vk-chat-bot` node.js framework.
 * Defines the {@link Bot} class.
 *
 * @author Artem Varaksa <aymfst@gmail.com>
 * @copyright Artem Varaksa 2017-2019
 */

import { log, requireParam } from './extra/log';

const express = require('express');
const bodyParser = require('body-parser');

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
  constructor(core, groupId, confirmationToken, secret, port) {
    requireParam('Bot#constructor', core, 'bot core');
    requireParam('Bot#constructor', confirmationToken, 'confirmation token (from Callback API settings)');
    requireParam('Bot#constructor', groupId, 'group id');
    requireParam('Bot#constructor', secret, 'secret key (from Callback API settings)');
    requireParam('Bot#constructor', port, 'port');

    /**
     * Core
     *
     * @type {Core}
     * @memberof Bot
     */
    this.core = core;

    /**
     * Group ID
     *
     * @type {string|number}
     * @memberof Bot
     */
    this.groupId = groupId;

    /**
     * Confirmation token
     *
     * @type {string}
     * @memberof Bot
     */
    this.confirmationToken = confirmationToken;

    /**
     * Secret
     * @type {string}
     * @memberof Bot
     */
    this.secret = secret;

    /**
     * Port
     *
     * @type {number}
     * @memberof Bot
     */
    this.port = port;
  }

  /**
   * Starts the bot
   * @instance
   * @memberof Bot
   */
  start() {
    this.core.lock();

    // Does not count `message_new` event
    const evt = Object.values(this.core.eventHandlers).filter(e => e).length - 1;
    const pld = Object.keys(this.core.exactPayloadHandlers).length
              + this.core.dynPayloadHandlers.length;
    const cmd = this.core.commandHandlers.length;
    const reg = this.core.regexHandlers.length;
    log().i(`Handlers count: on:${evt} cmd:${cmd} regex:${reg} payload:${pld}`).from('bot').now();

    if ((evt + cmd + reg + pld) === 0) {
      log().w('The bot won\'t do anything without handlers!').from('bot').now();
    }

    log().i('Preparing and starting the server...').from('bot').now();

    const app = express();

    app.use(bodyParser.json());

    app.get('/', (req, res) => {
      res.status(400).send('Only POST allowed.');
      log().w('Received a GET request').from('bot').now();
    });

    app.post('/', (req, res) => {
      const { body } = req;

      if (body.secret !== this.secret) {
        res.status(400).send('Invalid secret key.');
        log().w('Received a request with an invalid secret key').from('bot').now();
        return;
      }

      if (body.group_id.toString() !== this.groupId) {
        res.status(400).send('Invalid group id.');
        log().w('Received a request with an invalid group id').from('bot').now();
        return;
      }

      if (body.type === 'confirmation') {
        res.status(200).send(this.confirmationToken);
        log().r('Sent confirmation token.').from('bot').now();
      } else {
        res.status(200).send('ok');
        this.core.parseRequest(body);
      }
    });

    const server = app.listen(this.port, (err) => {
      if (err) {
        log().e(`Error occured while starting the server: ${err}`).from('bot').now();
      }

      log().i(`Server is listening on port ${this.port}`).from('bot').now();

      // Quit in test mode
      if (process.env.TEST_MODE) {
        server.close();
      }
    });
  }
}

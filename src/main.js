/**
 * @file A part of `vk-chat-bot` node.js framework.
 * Defines the {@link bot} quick creation function
 * and the exported object, {@link vk}.
 *
 * @author Artem Varaksa <aymfst@gmail.com>
 * @copyright Artem Varaksa 2017-2018
 */

import Bot from './bot'
import Core from './core'

import API from './api/api'
import Context from './api/context'
import * as kbd from './api/keyboard'

import * as log from './extra/log'
import Stats from './extra/stats'

const chalk = require('chalk')

process.on('uncaughtException', err => {
  if (!process.env.TEST_MODE) {
    var note = chalk.inverse(`• An error occured. The messages below may contain
• useful information about the problem.
• If you think this is an issue with 'vk-chat-bot' itself,
• please report it at <https://github.com/u32i64/vk-chat-bot/issues>.`)

    console.log(`\n\n${note}\n\n`)
  }

  console.log(err)
  process.exit(1)
})

/**
 * @typedef core_and_bot
 * @type {Object}
 * @property {Core} core the Core object
 * @property {Bot} bot the Bot object
 */

/**
 * Creates all the necessary objects for the bot and the [Bot]{@link Bot} object itself
 * @param {Object} params - parameters object
 * @param {string} params.vk_token - an API token of a VK community
 * @param {string} params.confirmation_token - confirmation token from Callback API settings
 * @param {string} params.group_id - group ID from Callback API settings
 * @param {string} params.secret - secret key (can be set in Callback API settings)
 * @param {number} params.port - the port bot will run at
 * @param {string} [params.cmd_prefix = ""] - each command (for [Core#cmd]{@link Core#cmd} handlers) should start with this prefix to be recognized
 *
 * @return {core_and_bot} core and bot objects
 *
 * @example
 * var params = {
 *    vk_token: 'your_vk_access_token',
 *    confirmation_token: 'f123456',
 *    group_id: 1234567,
 *    secret: 's3r10us1y_s3cr3t_phr4s3',
 *    port: 12345,
 *
 *    cmd_prefix: "/"
 *  }
 *
 *  var {bot, core} = vk.bot(params)
 */
function bot (params) {
  log.requireParam('bot', params, 'parameters for the bot')
  log.requireParam('bot', params.vk_token, 'VK API token')
  log.requireParam('bot', params.confirmation_token, 'confirmation token (from Callback API settings)')
  log.requireParam('bot', params.group_id, 'group id')
  log.requireParam('bot', params.secret, 'secret key (from Callback API settings)')
  log.requireParam('bot', params.port, 'port')

  var groupId = params.group_id.toString()
  var confirmationToken = params.confirmation_token.toString()
  var secret = params.secret.toString()
  var port = params.port

  var vkToken = params.vk_token.toString()
  var cmdPrefix = params.cmd_prefix ? params.cmd_prefix.toString() : ''

  var stats = new Stats()
  var api = new API(vkToken, stats)
  var core = new Core(api, stats, cmdPrefix, groupId)
  var bot = new Bot(core, groupId, confirmationToken, secret, port)

  return {
    bot,
    core
  }
}

/**
 * The exported object. Use it to get what you need.
 *
 * @type {Object}
 * @property {function} bot the quick creation function, [bot]{@link bot}
 * @property {class} Bot the [Bot]{@link Bot} class
 * @property {class} Core the [Core]{@link Core} class
 * @property {class} API the [API]{@link API} class
 * @property {class} Context the [Context]{@link Context} class
 * @property {Object} kbd keyboard classes, see {@link Keyboard}, {@link Button}, and {@link colors}
 * @property {Object} log logging functions, see [log module]{@link module:log}
 * @property {class} Stats the [Stats]{@link Stats} class
 *
 * @example
 * const vk = require('vk-chat-bot')
 * // ...
 */
var vk = {
  // Quick creation function
  bot,

  // src/
  Bot,
  Core,

  // src/api/
  API,
  Context,
  kbd,

  // src/extra/
  log,
  Stats
}

export default vk

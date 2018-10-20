/**
 * @file A part of `vk-chat-bot` node.js framework
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

/**
 * Creates all the necessary objects for the bot and the [Bot]{@link module:bot~Bot} object itself
 * @param {Object} params - parameters object
 * @param {string} params.vk_token - an API token of a VK community
 * @param {string} params.confirmation_token - confirmation token from Callback API settings
 * @param {string} params.group_id - group ID from Callback API settings
 * @param {string} params.secret - secret key (can be set in Callback API settings)
 * @param {number} params.port - the port bot will run at
 * @param {string} [params.cmd_prefix = ""] - each command (for [Core#cmd]{@link module:core~Core#cmd} handlers) should start with this prefix to be recognized
 * @return {{core: Core, bot: Bot}} core and bot objects
 */
function bot (params) {
  process.on('uncaughtException', err => {
    console.log(err)
    process.exit(1)
  })

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

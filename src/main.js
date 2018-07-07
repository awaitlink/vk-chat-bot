import Bot from './bot'
import Core from './core'

import API from './api/api'
import Context from './api/context'
import * as kbd from './api/keyboard'

import * as log from './extra/log'
import Stats from './extra/stats'

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
  var core = new Core(api, stats, cmdPrefix)
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

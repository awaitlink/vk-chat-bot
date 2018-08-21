import {err, warn, requireParam, requireFunction} from './extra/log'
import Context from './api/context'
import '@babel/polyfill'

export default class Core {
  constructor (api, stats, cmdPrefix) {
    requireParam('Core#constructor', api, 'API object')
    requireParam('Core#constructor', stats, 'statistics object')
    requireParam('Core#constructor', cmdPrefix, 'command prefix')

    this.api = api
    this.stats = stats
    this.cmdPrefix = cmdPrefix

    this.locked = false

    this.eventCount = 0
    this.eventHandlers = {
      message_new: null,
      message_reply: null,
      message_edit: null,
      message_typing_state: null,
      message_allow: null,
      message_deny: null,

      start: null,
      no_match: null,
      handler_error: null
    }

    this.commandHandlers = []
    this.regexHandlers = []

    this.eventWarnings = true

    this.registerMessageNewHandler()
  }

  noEventWarnings () {
    this.eventWarnings = false
    warn('bot', 'Warnings about missing event handlers were disabled')
  }

  lock () {
    this.locked = true
  }

  isLocked () {
    if (this.locked) {
      warn('bot', 'You tried to register a handler while the bot is running. This action was prevented for safety reasons')
    }

    return this.locked
  }

  // For special events
  on (event, callback) {
    if (this.isLocked()) {
      return
    }

    requireParam('Core.on', event, 'event name')
    requireParam('Core.on', callback, 'callback')

    requireFunction(callback)

    if (!Object.keys(this.eventHandlers).includes(event)) {
      err('bot', `Cannot register a handler: unsupported event type '${event}'`)
    }

    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = callback
      this.eventCount++
    } else {
      if (event === 'message_new') {
        err('bot', `Cannot register a handler: handler for 'message_new' is defined internally`)
      } else {
        err('bot', `Cannot register a handler: duplicate handler for '${event}'`)
      }
    }
  }

  // On exact command with prefix
  cmd (command, callback, description = '') {
    if (this.isLocked()) {
      return
    }

    requireParam('Core.cmd', command, 'command')
    requireParam('Core.cmd', callback, 'callback')
    requireFunction(callback)

    this.commandHandlers.push({
      command,
      description,
      callback
    })
  }

  // On matching regex
  regex (regex, callback) {
    if (this.isLocked()) {
      return
    }

    requireParam('Core.regex', regex, 'regular expression')
    requireParam('Core.regex', callback, 'callback')

    requireFunction(callback)

    this.regexHandlers.push({
      regex,
      callback
    })
  }

  async parseRequest (body) {
    var obj = body.object
    var event = body.type

    var $ = new Context(this.api, event, obj, obj.text)
    await this.event(event, $)
  }

  async event (name, $) {
    this.stats.event(name)

    if (this.eventHandlers[name]) {
      try {
        await this.eventHandlers[name]($)

        if ($.autoSend && name !== 'message_new') {
          await $.send()
        }
      } catch (error) {
        warn('bot', `Error in handler: ${error}`)

        if (name !== 'handler_error') {
          await this.event('handler_error', $)
        }
      }
    } else {
      if (this.eventWarnings) {
        warn('bot', `No handler for event '${name}'`)
      }
    }
  }

  registerMessageNewHandler () {
    this.on('message_new', async $ => {
      var payload = $.obj.payload
      if (payload) {
        try {
          if (JSON.parse(payload).command === 'start') {
            await this.event('start', $)
            return
          }
        } catch (e) { /* JSON Parse Error */ }
      }

      var isCommandHandled = await this.handleCommand($)

      if (!isCommandHandled) {
        var isRegexHandled = await this.handleRegex($)

        if (!isRegexHandled) {
          warn('bot', `Don't know how to respond to ${JSON.stringify($.msg).replace(/\n/g, '\\n')}, calling 'no_match' event`)
          await this.event('no_match', $)
          return
        }
      }

      if ($.autoSend) {
        await $.send()
      }
    })
    this.eventCount-- // Do not count 'message_new' event
  }

  async handleCommand ($) {
    var prefix = this.escapeRegex(this.cmdPrefix || '')

    for (var i = 0; i < this.commandHandlers.length; i++) {
      var cmdHandler = this.commandHandlers[i]
      var cmd = this.escapeRegex(cmdHandler.command)
      var cmdRegex = new RegExp(`^(${prefix}${cmd})( +${prefix}${cmd})*`, 'gi')

      if (cmdRegex.test($.msg)) {
        $.msg = $.msg.replace(cmdRegex, '')
        await cmdHandler.callback($)
        return true
      }
    }

    return false
  }

  async handleRegex ($) {
    for (var i = 0; i < this.regexHandlers.length; i++) {
      var regexHandler = this.regexHandlers[i]

      if (regexHandler.regex.test($.msg)) {
        await regexHandler.callback($)
        return true
      }
    }

    return false
  }

  help () {
    var helpMessage = '\n'

    for (var i = 0; i < this.commandHandlers.length; i++) {
      var commandHelpEntry = ''

      commandHelpEntry += this.cmdPrefix
      commandHelpEntry += this.commandHandlers[i].command

      if (this.commandHandlers[i].description) {
        commandHelpEntry += ' - '
        commandHelpEntry += this.commandHandlers[i].description
      }

      helpMessage += commandHelpEntry + '\n'
    }

    return helpMessage
  }

  escapeRegex (s) {
    return s.replace(/[-|/\\^$*+?.()|[\]{}]/g, '\\$&')
  }
}

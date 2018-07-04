import {error, warn, requireParam, requireFunction} from './extra/log'
import Stats from './extra/stats'
import API from './api/api'
import Context from './api/context'
import '@babel/polyfill'

export default class Behavior {
  constructor (vkToken, cmdPrefix) {
    this.stats = new Stats()

    this.api = new API(vkToken, this.stats)
    this.cmdPrefix = cmdPrefix

    this.isInTestMode = this.api.isInTestMode

    this.locked = false

    this.commandHandlers = []
    this.regexHandlers = []
    this.eventHandlers = []
    this.possibleEvents = [
      'message_allow',
      'message_deny',
      'message_edit',
      'message_reply',
      'message_typing_state',

      'no_match',
      'handler_error'
    ]

    this.noEventWarnings = false
  }

  lock () {
    this.locked = true
  }

  isLocked () {
    if (this.locked) {
      warn('You tried to register a handler while the bot is running. This action was prevented for safety reasons.')
    }

    return this.locked
  }

  // On exact command with prefix
  cmd (command, callback, description) {
    if (this.isLocked()) {
      return
    }

    requireParam('Behavior.cmd', command, 'command')
    requireParam('Behavior.cmd', callback, 'callback')

    if (!description) {
      description = ''
    }

    requireFunction(callback)

    this.commandHandlers.push({
      command: command,
      description: description,
      callback: callback
    })
  }

  // On matching regex
  regex (regex, callback) {
    if (this.isLocked()) {
      return
    }

    requireParam('Behavior.regex', regex, 'regular expression')
    requireParam('Behavior.regex', callback, 'callback')

    requireFunction(callback)

    this.regexHandlers.push({
      regex: regex,
      callback: callback
    })
  }

  // For special events
  on (e, callback) {
    if (this.isLocked()) {
      return
    }

    requireParam('Behavior.on', e, 'event name')
    requireParam('Behavior.on', callback, 'callback')

    requireFunction(callback)

    if (!this.possibleEvents.includes(e)) {
      error('Tried to register a handler for an unsupported event type: ' + e)
    }

    this.eventHandlers.push({
      event: e,
      callback: callback
    })
  }

  // Parse Callback API's message
  async parseRequest (body) {
    var obj = body.object
    var type = body.type

    this.stats.event(type)

    if (type === 'message_new') {
      try {
        await this.handleMessage(obj)
      } catch (e) {
        await this.handleHandlerError(obj, e)
      }
    } else {
      try {
        await this.handleEvent(type, obj)
      } catch (e) {
        warn(e)
      }
    }
  }

  // Handles message_new
  async handleMessage (obj) {
    var result = await this.handleWithCommand(obj)

    if (result === 'no') {
      result = await this.handleWithRegex(obj)

      if (result === 'no') {
        await this.noMatchFound(obj)
      }
    }
  }

  async handleWithCommand (obj) {
    var msg = obj.text

    // See if there is a matching command
    for (var i = 0; i < this.commandHandlers.length; i++) {
      var cmdHandler = this.commandHandlers[i]
      var cmd = this.escapeRegex(cmdHandler.command)
      var prefix = this.escapeRegex(this.cmdPrefix || '')
      var cmdRegex = new RegExp(`^(${prefix}${cmd})( +${prefix}${cmd})*`, 'gi')
      var cleanMessage = msg.replace(cmdRegex, '')

      if (cmdRegex.test(msg)) {
        var $ = new Context(this.api, 'message_new', obj, cleanMessage)
        await cmdHandler.callback($)

        if ($.autoSend) {
          await $.send()
        }

        return Promise.resolve()
      }
    }

    return Promise.resolve('no')
  }

  async handleWithRegex (obj) {
    var msg = obj.text

    // Try to use a regex handler
    for (var i = 0; i < this.regexHandlers.length; i++) {
      var regexHandler = this.regexHandlers[i]

      if (regexHandler.regex.test(msg)) {
        var $ = new Context(this.api, 'message_new', obj, msg)
        await regexHandler.callback($)

        if ($.autoSend) {
          await $.send()
        }

        return Promise.resolve()
      }
    }

    return Promise.resolve('no')
  }

  async noMatchFound (obj) {
    // Call the no_match event
    warn(`Don't know how to respond to: '${obj.text.toString().replace(/\n/g, '\\n')}' - calling 'no_match' event`)
    this.stats.event('no_match')
    return this.handleEvent('no_match', obj)
  }

  async handleHandlerError (obj, e) {
    warn(`Error happened in handler, calling 'handler_error' event: ${e}`)
    this.stats.event('handler_error')
    return this.handleEvent('handler_error', obj)
  }

  // Handle a special event
  async handleEvent (e, obj) {
    try {
      if (!this.possibleEvents.includes(e)) {
        return Promise.reject(new Error('Received an unsupported event type: ' + e))
      }

      for (var i = 0; i < this.eventHandlers.length; i++) {
        var eventHandler = this.eventHandlers[i]
        if (eventHandler.event === e) {
          var $ = new Context(this.api, e, obj, obj.text)
          await eventHandler.callback($)

          if ($.autoSend) {
            await $.send()
          }

          return Promise.resolve()
        }
      }

      if (this.noEventWarnings) {
        return Promise.resolve()
      } else {
        return Promise.reject(new Error('No handler found for event: ' + e))
      }
    } catch (err) {
      if (e === 'handler_error') {
        warn(`Error happened in 'handler_error' handler!`)
      } else {
        this.handleHandlerError(obj, err)
      }
    }
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

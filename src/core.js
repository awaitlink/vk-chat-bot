import {err, warn, requireParam, requireFunction} from './extra/log'
import Context from './api/context'
import '@babel/polyfill'

export default class Core {
  constructor (api, stats, cmdPrefix, groupId) {
    requireParam('Core#constructor', api, 'API object')
    requireParam('Core#constructor', stats, 'statistics object')
    requireParam('Core#constructor', cmdPrefix, 'command prefix')
    requireParam('Core#constructor', groupId, 'group id')

    this.api = api
    this.stats = stats

    this.cmdPrefix = cmdPrefix
    this.escapedCmdPrefix = this.escapeRegex(this.cmdPrefix || '')
    this.groupId = this.escapeRegex(groupId) // Just in case

    this.locked = false

    this.eventCount = 0
    this.eventHandlers = {
      // Callback API
      message_new: null,
      message_reply: null,
      message_edit: null,
      message_typing_state: null,
      message_allow: null,
      message_deny: null,

      // Detected when parsing 'message_new' event
      start: null,
      service_action: null,

      // Internal events
      no_match: null,
      handler_error: null
    }

    this.payloadCount = 0
    this.exactPayloadHandlers = {}
    this.dynPayloadHandlers = []

    this.commandHandlers = []
    this.regexHandlers = []

    this.eventWarnings = true

    this.registerMessageNewHandler()
  }

  noEventWarnings () {
    this.eventWarnings = false
    warn('core', 'Warnings about missing event handlers were disabled')
  }

  lock () {
    this.locked = true
    this.generateHelpMessage()
  }

  isLocked () {
    if (this.locked) {
      warn('core', 'Registering a handler while the bot is running is not allowed')
    }

    return this.locked
  }

  // For special events
  on (event, callback) {
    if (this.isLocked()) return

    requireParam('Core#on', event, 'event name')
    requireParam('Core#on', callback, 'callback')
    requireFunction(callback)

    if (!Object.keys(this.eventHandlers).includes(event)) {
      err('core', `Cannot register a handler: unknown event type '${event}'`)
    }

    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = callback
      this.eventCount++
    } else {
      if (event === 'message_new') {
        err('core', `Cannot register a handler: handler for the 'message_new' event is defined internally`)
      } else {
        err('core', `Cannot register a handler: duplicate handler for event '${event}'`)
      }
    }
  }

  // For payloads
  payload (payload, callback) {
    if (this.isLocked()) return

    requireParam('Core#payload', payload, 'target payload')
    requireParam('Core#payload', callback, 'callback')
    requireFunction(callback)

    if (typeof payload !== 'function') {
      // Exact payload match:

      if (!this.exactPayloadHandlers[JSON.stringify(payload)]) {
        this.exactPayloadHandlers[JSON.stringify(payload)] = callback
        this.payloadCount++
      } else {
        err('core', `Cannot register a handler: duplicate handler for payload '${payload}'`)
      }
    } else {
      // Dynamic payload match:

      this.dynPayloadHandlers.push({
        tester: payload,
        callback
      })

      this.payloadCount++
    }
  }

  // On exact command with prefix
  cmd (command, callback, description = '') {
    if (this.isLocked()) return

    requireParam('Core#cmd', command, 'command')
    requireParam('Core#cmd', callback, 'callback')
    requireFunction(callback)

    this.commandHandlers.push({
      command,
      description,
      callback
    })
  }

  // On matching regex
  regex (regex, callback) {
    if (this.isLocked()) return

    requireParam('Core#regex', regex, 'regular expression')
    requireParam('Core#regex', callback, 'callback')
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
        warn('core', `Error in handler: ${error}`)

        if (name !== 'handler_error') {
          await this.event('handler_error', $)
        }
      }
    } else {
      if (this.eventWarnings) {
        warn('core', `No handler for event '${name}'`)
      }
    }
  }

  registerMessageNewHandler () {
    this.on('message_new', async $ => {
      // Check for 'service_action' event
      if ($.obj.action) {
        await this.event('service_action', $)
        return
      }

      // Handle regular message
      if (!await this.tryHandlePayload($)) {
        if (!await this.tryHandleCommand($)) {
          if (!await this.tryHandleRegex($)) {
            warn('core', `Don't know how to respond to ${JSON.stringify($.msg).replace(/\n/g, '\\n')}, calling 'no_match' event`)
            await this.event('no_match', $)
            return
          }
        }
      }

      if ($.autoSend) await $.send()
    })

    this.eventCount-- // Do not count 'message_new' event
  }

  async tryHandlePayload ($) {
    var payload = $.obj.payload
    if (payload) {
      // Check for 'start' event
      try {
        if (JSON.parse(payload).command === 'start') {
          await this.event('start', $)
          $.noAutoSend() // Message sending was already handled by event
          return true
        }
      } catch (e) { /* JSON Parse Error */ }

      // Check for exact payload handler
      if (this.exactPayloadHandlers[payload]) {
        await this.exactPayloadHandlers[payload]($)
        return true
      }

      // Check for dynamic payload handler
      for (var handler of this.dynPayloadHandlers) {
        var parsed = null
        try { parsed = JSON.parse(payload) } catch (e) { /* JSON Parse Error */ }

        if (handler.tester(payload, parsed)) {
          await handler.callback($)
          return true
        }
      }
    }

    return false
  }

  async tryHandleCommand ($) {
    for (var i = 0; i < this.commandHandlers.length; i++) {
      var cmdHandler = this.commandHandlers[i]
      var cmd = this.escapeRegex(cmdHandler.command)

      var cmdRegex = new RegExp(`^( *\\[club${this.groupId}\\|.*\\])?( *${this.escapedCmdPrefix}${cmd})+`, 'i')

      if (cmdRegex.test($.msg)) {
        $.msg = $.msg.replace(cmdRegex, '')
        await cmdHandler.callback($)
        return true
      }
    }

    return false
  }

  async tryHandleRegex ($) {
    for (var i = 0; i < this.regexHandlers.length; i++) {
      var regexHandler = this.regexHandlers[i]

      if (regexHandler.regex.test($.msg)) {
        await regexHandler.callback($)
        return true
      }
    }

    return false
  }

  generateHelpMessage () {
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

    this.helpMessage = helpMessage
  }

  help () {
    return this.helpMessage
  }

  escapeRegex (s) {
    return s.replace(/[-|/\\^$*+?.()|[\]{}]/g, '\\$&')
  }
}

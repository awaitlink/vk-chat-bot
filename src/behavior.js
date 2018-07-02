const log = new (require('./log.js'))()
const API = require('./api.js')
const APIBuffer = require('./api_buffer.js')
const Stats = require('./stats.js')

class Behavior {
  constructor (vkToken, cmdPrefix) {
    this.stats = new Stats()

    this.api = new API(vkToken, this.stats)
    this.cmdPrefix = cmdPrefix

    this.isInTestMode = this.api.isInTestMode

    this.locked = false

    this.commandHandlers = []
    this.regexHandlers = []
    this.eventHandlers = []
    this.possibleEvents = ['message_allow', 'message_deny', 'message_edit', 'message_reply', 'message_typing_state', 'no_match']
  }

  lock () {
    this.locked = true
  }

  isLocked () {
    if (this.locked) {
      log.warn('You tried to register a handler while the bot is running. This action was prevented for safety reasons.')
    }

    return this.locked
  }

  // On exact command with prefix
  cmd (command, callback, description) {
    if (this.isLocked()) {
      return
    }

    log.requireParam('Behavior.cmd', command, 'command')
    log.requireParam('Behavior.cmd', callback, 'callback')

    if (!description) {
      description = ''
    }

    log.requireFunction(callback)

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

    log.requireParam('Behavior.regex', regex, 'regular expression')
    log.requireParam('Behavior.regex', callback, 'callback')

    log.requireFunction(callback)

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

    log.requireParam('Behavior.on', e, 'event name')
    log.requireParam('Behavior.on', callback, 'callback')

    log.requireFunction(callback)

    if (!this.possibleEvents.includes(e)) {
      log.error('Tried to register a handler for an unsupported event type: ' + e)
    }

    this.eventHandlers.push({
      event: e,
      callback: callback
    })
  }

  // Parse Callback API's message
  parseRequest (body) {
    var obj = body.object
    var type = body.type

    this.stats.event(type)

    if (type === 'message_new') {
      this.handleMessage(obj)
    } else {
      this.handleEvent(type, obj)
    }
  }

  // Handles message_new
  handleMessage (obj) {
    this.handleWithCommand(obj) || this.handleWithRegex(obj) || this.noMatchFound(obj)
  }

  handleWithCommand (obj) {
    var msg = obj.text

    // See if there is a matching command
    for (var i = 0; i < this.commandHandlers.length; i++) {
      var cmdHandler = this.commandHandlers[i]
      var cmd = this.escapeRegex(cmdHandler.command)
      var prefix = this.escapeRegex(this.cmdPrefix || '')
      var cmdRegex = new RegExp(`^(${prefix}${cmd})( +${prefix}${cmd})*`, 'gi')
      var cleanMessage = msg.replace(cmdRegex, '')

      if (cmdRegex.test(msg)) {
        var $ = new APIBuffer(this.api, 'message_new', obj, cleanMessage)
        cmdHandler.callback($)

        if ($.autoSend) {
          $.send()
        }

        return true
      }
    }

    return false
  }

  handleWithRegex (obj) {
    var msg = obj.text

    // Try to use a regex handler
    for (var i = 0; i < this.regexHandlers.length; i++) {
      var regexHandler = this.regexHandlers[i]

      if (regexHandler.regex.test(msg)) {
        var $ = new APIBuffer(this.api, 'message_new', obj, msg)
        regexHandler.callback($)

        if ($.autoSend) {
          $.send()
        }

        return true
      }
    }

    return false
  }

  noMatchFound (obj) {
    // Call the no_match event
    log.warn("Don't know how to respond to: \"" + obj.text + "\"; calling 'no_match' event")
    this.stats.event('no_match')
    this.handleEvent('no_match', obj)
  }

  // Handle a special event
  handleEvent (e, obj) {
    if (!this.possibleEvents.includes(e)) {
      log.error('Received an unsupported event type: ' + e)
      return
    }

    for (var i = 0; i < this.eventHandlers.length; i++) {
      var eventHandler = this.eventHandlers[i]
      if (eventHandler.event === e) {
        var $ = new APIBuffer(this.api, e, obj, obj.text)
        eventHandler.callback($)

        if ($.autoSend) {
          $.send()
        }

        return
      }
    }

    log.warn('No handler found for event: ' + e)
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

module.exports = Behavior

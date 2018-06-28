const log = new (require('./log.js'))()
const API = require('./api.js')
const APIBuffer = require('./api_buffer.js')

class Behavior {
  constructor (vkToken, cmdPrefix) {
    this.api = new API(vkToken)
    this.cmdPrefix = cmdPrefix

    this.isInTestMode = this.api.isInTestMode

    this.commandHandlers = []
    this.regexHandlers = []
    this.eventHandlers = []
    this.possibleEvents = ['message_allow', 'message_deny', 'message_edit', 'message_reply', 'message_typing_state', 'no_match']
  }

  // On exact command with prefix
  cmd (command, callback, description) {
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
    var pid = obj.peer_id
    var type = body.type

    if (type === 'message_new') {
      log.log(log.type.request, 'New message in peer: ' + pid)
      this.handleMessage(obj)
    } else {
      log.log(log.type.request, 'Received event: ' + type)
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
        $.send()

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
        $.send()

        return true
      }
    }

    return false
  }

  noMatchFound (obj) {
    // Call the no_match event
    log.log(log.type.information, "Don't know how to respond to: \"" + obj.text + "\"; calling 'no_match' event")
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
        $.send()

        return
      }
    }

    log.log(log.type.information, 'No handler found for event: ' + e)
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

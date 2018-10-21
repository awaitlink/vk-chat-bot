/**
 * @file A part of `vk-chat-bot` node.js framework
 * @author Artem Varaksa <aymfst@gmail.com>
 * @copyright Artem Varaksa 2017-2018
 */

/**
 * @module core
 */

import {
  err,
  warn,
  requireParam,
  requireFunction
} from './extra/log'
import Context from './api/context'
import '@babel/polyfill'

export default class Core {
  /**
   * @class Core
   *
   * @return {Core}
   *
   * @param {API} api - `API` object
   * @param {Stats} stats - statistics object
   * @param {string} cmdPrefix - command prefix
   * @param {string|number} groupId - group id
   *
   * @classdesc
   * `Core` dispatches message handling to appropriate handlers,
   * and is used for setting these handlers.
   *
   * Handlers for the `message_new` event will be searched in this order:
   * 1. If service action message => [Core#on]{@link module:core~Core#on} handler for the `service_action` event
   * 1. If user pressed the `Start` button => [Core#on]{@link module:core~Core#on} handler for the `start` event
   * 1. [Core#payload]{@link module:core~Core#payload}
   * 1. [Core#cmd]{@link module:core~Core#cmd}
   * 1. [Core#regex]{@link module:core~Core#regex}
   *
   * For other events, a matching [Core#on]{@link module:core~Core#on} handler will be called.
   */
  constructor (api, stats, cmdPrefix, groupId) {
    requireParam('Core#constructor', api, 'API object')
    requireParam('Core#constructor', stats, 'statistics object')
    requireParam('Core#constructor', cmdPrefix, 'command prefix')
    requireParam('Core#constructor', groupId, 'group id')

    /**
     * @type {API}
     * @readonly
     * @memberof module:core~Core
     */
    this.api = api

    /**
     * @type {Stats}
     * @readonly
     * @memberof module:core~Core
     */
    this.stats = stats

    /**
     * Command prefix
     *
     * @private
     * @type {string}
     * @memberof module:core~Core
     */
    this._cmdPrefix = cmdPrefix

    /**
     * Command prefix, escaped for usage in regular expressions
     *
     * @private
     * @type {string}
     * @memberof module:core~Core
     */
    this._escapedCmdPrefix = this._escapeRegex(this._cmdPrefix || '')

    /**
     * Group ID
     *
     * @private
     * @type {string}
     * @memberof module:core~Core
     */
    this._groupId = this._escapeRegex(groupId) // Just in case

    /**
     * Is this `Core` locked?
     *
     * @private
     * @type {boolean}
     * @memberof module:core~Core
     */
    this._locked = false

    /**
     * Count of event handlers
     *
     * @private
     * @type {number}
     * @memberof module:core~Core
     * @todo Couldn't we just count this by using [Core#eventHandlers]{@link module:core#eventHandlers} when needed?
     */
    this._eventCount = 0

    /**
     * Handlers for events
     *
     * @private
     * @memberof module:core~Core
     * @type {Object}
     */
    this._eventHandlers = {
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

    /**
     * Count of payload handlers
     *
     * @private
     * @memberof module:core~Core
     * @type {number}
     * @todo Just [Core#exactPayloadHandlers]{@link module:core#exactPayloadHandlers}.length + [Core#dynPayloadHandlers]{@link module:core#dynPayloadHandlers}.length. Why this is needed?
     */
    this._payloadCount = 0

    /**
     * Exact payload handlers
     *
     * @private
     * @memberof module:core~Core
     * @type {Object}
     */
    this._exactPayloadHandlers = {}

    /**
     * Dynamic payload handlers (those which use functions to determine whether a handler is suitable)
     *
     * @private
     * @memberof module:core~Core
     * @type {Object[]}
     */
    this._dynPayloadHandlers = []

    /**
     * Command handlers
     *
     * @private
     * @memberof module:core~Core
     * @type {Object[]}
     */
    this._commandHandlers = []

    /**
     * Regular expression handlers
     *
     * @private
     * @memberof module:core~Core
     * @type {Object[]}
     */
    this._regexHandlers = []

    /**
     * Are event warnings enabled?
     *
     * @private
     * @memberof module:core~Core
     * @type {boolean}
     */
    this._eventWarnings = true

    /**
     * The help message
     *
     * @private
     * @memberof module:core~Core
     * @type {string}
     */
    this._helpMessage = ''

    this._registerMessageNewHandler()
  }

  /**
   * Disables warnings about missing event handlers
   * @memberof module:core~Core
   * @instance
   */
  noEventWarnings () {
    this._eventWarnings = false
    warn('core', 'Warnings about missing event handlers were disabled')
  }

  /**
   * Locks this `Core`, so new handlers can't be added,
   * and generates the help message for later usage
   *
   * @memberof module:core~Core
   * @instance
   */
  lock () {
    this._locked = true
    this._generateHelpMessage()
  }

  /**
   * Returns whether this `Core` is locked, and prints a message
   * to notify the user if it is locked
   *
   * @private
   * @memberof module:core~Core
   * @instance
   *
   * @return {boolean} is this `Core` locked?
   */
  _isLocked () {
    if (this._locked) {
      warn('core', 'Registering a handler while the bot is running is not allowed')
    }

    return this._locked
  }

  /**
   * A handler
   *
   * @callback handler
   * @param {Context} $ - a `Context` object
   */

  /**
   * Registers an event handler
   *
   * Does not work for `message_new`, as its handler is defined by `vk-chat-bot` itself.
   *
   * ### Events
   *
   * #### Callback API Events
   * Event | Description
   * ---|---
   * `message_allow` | User **allowed** sending messages to him/her
   * `message_deny` | User **disallowed** sending messages to him/her
   * `message_reply` | New **message sent** by community administrator (or by the bot itself)
   * `message_edit` | **Message edited** by user
   * `message_typing_state` | **User is typing** a message
   *
   * #### Other Events
   * Event type | When handler is called
   * ---|---
   * `start` | If the message's payload is `{"command": "start"}` (when user presses the `Start` button)
   * `service_action` | Service action message received
   * `no_match` | When no matching `cmd()` or `regex()` handler is found
   * `handler_error` | If an error is thrown in a handler
   *
   * #### The `service_action` event
   * > The `$.obj.action` object contains information about the service action.
   * > It contains the following fields:
   *
   * ```
   * type (string) — action type, one of:
   *    `chat_photo_update` — chat photo updated
   *    `chat_photo_remove` — chat photo removed
   *    `chat_create` — chat created
   *    `chat_title_update` — chat title updated
   *    `chat_invite_user` — user was invited to chat
   *    `chat_kick_user` — user was kicked from the chat
   *    `chat_pin_message` — a message was pinned
   *    `chat_unpin_message` — a message was unpinned
   *    `chat_invite_user_by_link` — user joined the chat by link
   *
   * member_id (integer):
   *   user id (if > 0), which was invited or kicked (if < 0, see `email` field)
   *     (`chat_invite_user`, `chat_invite_user_by_link`,  `chat_kick_user`)
   *   user id, which pinned or unpinned a message
   *     (`chat_pin_message`, `chat_unpin_message`)
   *
   * text (string):
   *   chat name
   *     (`chat_create`, `chat_title_update`)
   *
   * email (string):
   *   email, which was invited or kicked
   *     (`chat_invite_user`, `chat_kick_user`, member_id < 0)
   *
   * photo (object) — chat picture, contains:
   *     photo_50 (string): URL of image 50 x 50 px
   *     photo_100 (string): URL of image 100 x 100 px
   *     photo_200 (string): URL of image 200 x 200 px
   * ```
   *
   * @param {string} event - event name
   * @param {handler} callback - function, which will handle the message
   *
   * @memberof module:core~Core
   * @instance
   *
   * @example
   * core.on('no_match', $ => {
   *   $.text('I don\'t know how to respond to your message.')
   * })
   *
   */
  on (event, callback) {
    if (this._isLocked()) return

    requireParam('Core#on', event, 'event name')
    requireParam('Core#on', callback, 'callback')
    requireFunction(callback)

    if (!Object.keys(this._eventHandlers).includes(event)) {
      err('core', `Cannot register a handler: unknown event type '${event}'`)
    }

    if (!this._eventHandlers[event]) {
      this._eventHandlers[event] = callback
      this._eventCount++
    } else {
      if (event === 'message_new') {
        err('core', `Cannot register a handler: handler for the 'message_new' event is defined internally`)
      } else {
        err('core', `Cannot register a handler: duplicate handler for event '${event}'`)
      }
    }
  }

  /**
   * Payload tester
   *
   * @callback payload_tester
   * @param {string} payload_json - payload
   * @param {Object} payload - parsed payload
   * @return {boolean} is this payload suitable for this handler?
   */

  /**
   * Registers a payload handler
   *
   * **Note**: exact handlers are searched first, and only if they don't match, the search for a dynamic handler begins.
   *
   * @param {Object|payload_tester} payload - exact payload to handle, or a function which will determine whether to handle the payload or not
   * @param {handler} callback - function, which will handle the message
   *
   * @memberof module:core~Core
   * @instance
   *
   * @example
   * // -------> KEYBOARD (for sending the payload)
   *
   * // Create a keyboard
   * var Keyboard = vk.kbd.Keyboard
   * var Button = vk.kbd.Button
   * var colors = vk.kbd.colors
   *
   * var kbd = new Keyboard([[
   *      // Clicking on this button will send the payload {a: 'b'}
   *      new Button('Test 1', colors.default, {a: 'b'}),
   *      new Button('Test 2', colors.default, {a: 'b', c: 'd'})
   * ]], false)
   *
   * // When asked, send the keyboard
   * core.regex(/keyboard/i, $ => {
   *    $.keyboard(kbd)
   *    $.text('Here it is!')
   * })
   *
   * // -------> EXACT PAYLOAD
   * core.payload({a: 'b'}, $ => {
   *    $.text('Received secret payload!')
   * })
   *
   * // -------> DYNAMIC PAYLOAD
   * // In this case, the handler will run only if the
   * // payload's property `c` contains the value `d`.
   * core.payload((payload, parsed) => {
   *    if (parsed) { // If the payload is a valid JSON
   *      return parsed.c === 'd'
   *    } else {
   *      return false
   *    }
   * }, $ => {
   *    $.text(`In message '${$.msg}', payload.c is 'd'!`)
   * })
   *
   */
  payload (payload, callback) {
    if (this._isLocked()) return

    requireParam('Core#payload', payload, 'target payload')
    requireParam('Core#payload', callback, 'callback')
    requireFunction(callback)

    if (typeof payload !== 'function') {
      // Exact payload match:

      if (!this._exactPayloadHandlers[JSON.stringify(payload)]) {
        this._exactPayloadHandlers[JSON.stringify(payload)] = callback
        this._payloadCount++
      } else {
        err('core', `Cannot register a handler: duplicate handler for payload '${payload}'`)
      }
    } else {
      // Dynamic payload match:

      this._dynPayloadHandlers.push({
        tester: payload,
        callback
      })

      this._payloadCount++
    }
  }

  /**
   * Registers a command handler
   *
   * Handler is called if the message begins with `cmd_prefix` (defined in the parameters) **+** `command`
   *
   * @param {string} command - command
   * @param {handler} callback - function, which will handle the message
   * @param {string} [description = ""] - the description of what this command does, to be used in help messages
   *
   * @memberof module:core~Core
   * @instance
   *
   * @example
   * core.cmd('help', $ => {
   *   // core.help() returns the help message
   *   $.text('Test Bot' + core.help())
   * }, 'shows the help message')
   */
  cmd (command, callback, description = '') {
    if (this._isLocked()) return

    requireParam('Core#cmd', command, 'command')
    requireParam('Core#cmd', callback, 'callback')
    requireFunction(callback)

    this._commandHandlers.push({
      command,
      description,
      callback
    })
  }

  /**
   * Registers a regex handler
   *
   * @param {RegExp} regex - regular expression
   * @param {handler} callback - function, which will handle the message
   *
   * @memberof module:core~Core
   * @instance
   *
   * @example
   * core.regex(/h(i|ello|ey)/i, $ => {
   *    $.text('Hello, I am a test bot. You said: ' + $.msg)
   * })
   */
  regex (regex, callback) {
    if (this._isLocked()) return

    requireParam('Core#regex', regex, 'regular expression')
    requireParam('Core#regex', callback, 'callback')
    requireFunction(callback)

    this._regexHandlers.push({
      regex,
      callback
    })
  }

  /**
   * Parses the request, creates a `Context`, and proceeds
   * to call `Core#event` to handle the event
   *
   * @memberof module:core~Core
   * @instance
   *
   * @param {Object} body - body of the request, in parsed JSON
   *
   */
  async parseRequest (body) {
    var obj = body.object
    var event = body.type

    var $ = new Context(this.api, event, obj, obj.text)
    await this._event(event, $)
  }

  /**
   * Handles an event
   *
   * @private
   * @memberof module:core~Core
   * @instance
   *
   * @param {string} name - event name
   * @param {Context} $ - context object
   */
  async _event (name, $) {
    this.stats.event(name)

    if (this._eventHandlers[name]) {
      try {
        await this._eventHandlers[name]($)

        if ($.autoSend && name !== 'message_new') {
          await $.send()
        }
      } catch (error) {
        warn('core', `Error in handler: ${error}`)

        if (name !== 'handler_error') {
          await this._event('handler_error', $)
        }
      }
    } else {
      if (this._eventWarnings) {
        warn('core', `No handler for event '${name}'`)
      }
    }
  }

  /**
   * Registers a handler for `message_new` event
   * @private
   * @memberof module:core~Core
   * @instance
   */
  _registerMessageNewHandler () {
    this.on('message_new', async $ => {
      // Check for 'service_action' event
      if ($.obj.action) {
        await this._event('service_action', $)
        return
      }

      // Handle regular message
      if (!await this._tryHandlePayload($)) {
        if (!await this._tryHandleCommand($)) {
          if (!await this._tryHandleRegex($)) {
            warn('core', `Don't know how to respond to ${JSON.stringify($.msg).replace(/\n/g, '\\n')}, calling 'no_match' event`)
            await this._event('no_match', $)
            return
          }
        }
      }

      if ($.autoSend) await $.send()
    })

    this._eventCount-- // Do not count 'message_new' event
  }

  /**
   * Tries to handle the message in the given `Context`
   * with a payload handler
   *
   * @private
   * @memberof module:core~Core
   * @instance
   *
   * @param {Context} $ - context object
   *
   * @return {boolean} was the message handled?
   */
  async _tryHandlePayload ($) {
    var payload = $.obj.payload
    if (payload) {
      // Check for 'start' event
      try {
        if (JSON.parse(payload).command === 'start') {
          await this._event('start', $)
          $.noAutoSend() // Message sending was already handled by event
          return true
        }
      } catch (e) { /* JSON Parse Error */ }

      // Check for exact payload handler
      if (this._exactPayloadHandlers[payload]) {
        await this._exactPayloadHandlers[payload]($)
        return true
      }

      // Check for dynamic payload handler
      for (var handler of this._dynPayloadHandlers) {
        var parsed = null
        try {
          parsed = JSON.parse(payload)
        } catch (e) { /* JSON Parse Error */ }

        if (handler.tester(payload, parsed)) {
          await handler.callback($)
          return true
        }
      }
    }

    return false
  }

  /**
   * Tries to handle the message in the given `Context`
   * with a command handler
   *
   * @private
   * @memberof module:core~Core
   * @instance
   *
   * @param {Context} $ - context object
   *
   * @return {boolean} was the message handled?
   */
  async _tryHandleCommand ($) {
    for (var i = 0; i < this._commandHandlers.length; i++) {
      var cmdHandler = this._commandHandlers[i]
      var cmd = this._escapeRegex(cmdHandler.command)

      var cmdRegex = new RegExp(`^( *\\[club${this._groupId}\\|.*\\])?( *${this._escapedCmdPrefix}${cmd})+`, 'i')

      if (cmdRegex.test($.msg)) {
        $.msg = $.msg.replace(cmdRegex, '')
        await cmdHandler.callback($)
        return true
      }
    }

    return false
  }

  /**
   * Tries to handle the message in the given `Context`
   * with a regex handler
   *
   * @private
   * @memberof module:core~Core
   * @instance
   *
   * @param {Context} $ - context object
   *
   * @return {boolean} was the message handled?
   */
  async _tryHandleRegex ($) {
    for (var i = 0; i < this._regexHandlers.length; i++) {
      var regexHandler = this._regexHandlers[i]

      if (regexHandler.regex.test($.msg)) {
        await regexHandler.callback($)
        return true
      }
    }

    return false
  }

  /**
   * Generates the help message
   * @private
   * @memberof module:core~Core
   * @instance
   */
  _generateHelpMessage () {
    var helpMessage = '\n'

    for (var i = 0; i < this._commandHandlers.length; i++) {
      var commandHelpEntry = ''

      commandHelpEntry += this._cmdPrefix
      commandHelpEntry += this._commandHandlers[i].command

      if (this._commandHandlers[i].description) {
        commandHelpEntry += ' - '
        commandHelpEntry += this._commandHandlers[i].description
      }

      helpMessage += commandHelpEntry + '\n'
    }

    this._helpMessage = helpMessage
  }

  /**
   * Returns the help message
   *
   * @return {string} the help message
   *
   * @memberof module:core~Core
   * @instance
   */
  help () {
    return this._helpMessage
  }

  /**
   * Escapes a string for usage in regex.
   *
   * @private
   * @memberof module:core~Core
   * @instance
   *
   * @param {string} s - string to escape
   *
   * @return {string} the escaped string
   *
   */
  _escapeRegex (s) {
    return s.replace(/[-|/\\^$*+?.()|[\]{}]/g, '\\$&')
  }
}

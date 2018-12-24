/**
 * @file A part of `vk-chat-bot` node.js framework.
 * Defines the {@link Core} class.
 *
 * @author Artem Varaksa <aymfst@gmail.com>
 * @copyright Artem Varaksa 2017-2018
 */

import '@babel/polyfill';
import { log, requireParam, requireFunction } from './extra/log';
import Context from './api/context';

const escapeRegex = require('escape-string-regexp');

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
   * 1. If service action message => [Core#on]{@link Core#on} handler for the `service_action` event
   * 1. If user pressed the `Start` button => [Core#on]{@link Core#on} handler for the `start` event
   * 1. [Core#payload]{@link Core#payload}
   * 1. [Core#cmd]{@link Core#cmd}
   * 1. [Core#regex]{@link Core#regex}
   *
   * For other events, a matching [Core#on]{@link Core#on} handler will be called.
   */
  constructor(api, stats, cmdPrefix, groupId) {
    requireParam('Core#constructor', api, 'API object');
    requireParam('Core#constructor', stats, 'statistics object');
    requireParam('Core#constructor', cmdPrefix, 'command prefix');
    requireParam('Core#constructor', groupId, 'group id');

    /**
     * @type {API}
     * @readonly
     * @memberof Core
     */
    this.api = api;

    /**
     * @type {Stats}
     * @readonly
     * @memberof Core
     */
    this.stats = stats;

    /**
     * Command prefix
     * @type {string}
     * @memberof Core
     */
    this.cmdPrefix = cmdPrefix;

    /**
     * Command prefix, escaped for usage in regular expressions
     * @type {string}
     * @memberof Core
     */
    this.escapedCmdPrefix = escapeRegex(this.cmdPrefix);

    /**
     * Group ID
     * @type {string}
     * @memberof Core
     */
    this.groupId = escapeRegex(groupId); // Just in case

    /**
     * Is this `Core` locked?
     * @type {boolean}
     * @memberof Core
     */
    this.locked = false;

    /**
     * Handlers for events
     * @memberof Core
     * @type {Object}
     */
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
      handler_error: null,
    };

    /**
     * Exact payload handlers
     * @memberof Core
     * @type {Object}
     */
    this.exactPayloadHandlers = {};

    /**
     * Dynamic payload handlers
     * (which use functions to determine whether a handler is suitable)
     * @memberof Core
     * @type {Object[]}
     */
    this.dynPayloadHandlers = [];

    /**
     * Command handlers
     * @memberof Core
     * @type {Object[]}
     */
    this.commandHandlers = [];

    /**
     * Regular expression handlers
     * @memberof Core
     * @type {Object[]}
     */
    this.regexHandlers = [];

    /**
     * Are event warnings enabled?
     * @memberof Core
     * @type {boolean}
     */
    this.eventWarnings = true;

    /**
     * The help message
     * @memberof Core
     * @type {string}
     */
    this.helpMessage = '';

    this.registerMessageNewHandler();
  }

  /**
   * Disables warnings about missing event handlers
   * @memberof Core
   * @instance
   */
  noEventWarnings() {
    this.eventWarnings = false;
    log().w('Warnings about missing event handlers were disabled').from('core').now();
  }

  /**
   * Locks this `Core`, so new handlers can't be added,
   * and generates the help message for later usage
   *
   * @memberof Core
   * @instance
   */
  lock() {
    this.locked = true;
    this.generateHelpMessage();
  }

  /**
   * Returns whether this `Core` is locked, and prints a message
   * to notify the user if it is locked
   *
   *
   * @memberof Core
   * @instance
   *
   * @return {boolean} is this `Core` locked?
   */
  isLocked() {
    if (this.locked) {
      log().w('Registering a handler while the bot is running is not allowed').from('core').now();
    }

    return this.locked;
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
   * `start` | If the message's payload is `{"command": "start"}` (i.e. `Start` button pressed)
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
   * @memberof Core
   * @instance
   *
   * @example
   * core.on('no_match', $ => {
   *   $.text('I don\'t know how to respond to your message.');
   * });
   *
   */
  on(event, callback) {
    if (this.isLocked()) return;

    requireParam('Core#on', event, 'event name');
    requireParam('Core#on', callback, 'callback');
    requireFunction(callback);

    if (!Object.keys(this.eventHandlers).includes(event)) {
      log().e(`Cannot register a handler: unknown event type '${event}'`).from('core').now();
    }

    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = callback;
    } else if (event === 'message_new') {
      log().e('Cannot register a handler: handler for the \'message_new\' event is defined internally').from('core').now();
    } else {
      log().e(`Cannot register a handler: duplicate handler for event '${event}'`).from('core').now();
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
   * **Note**: exact handlers are searched first, and only if they don't match,
   * the search for a dynamic handler begins.
   *
   * @param {Object|payload_tester} payload - exact payload to handle,
   * or a function which will determine whether to handle the payload or not
   * @param {handler} callback - function, which will handle the message
   *
   * @memberof Core
   * @instance
   *
   * @example
   * // -------> KEYBOARD (for sending the payload)
   *
   * // Create a keyboard
   * const { colors, Keyboard, Button } = vk.kbd;
   *
   * var kbd = new Keyboard([[
   *      // Clicking on this button will send the payload {a: 'b'}
   *      new Button('Test 1', colors.default, {a: 'b'}),
   *      new Button('Test 2', colors.default, {a: 'b', c: 'd'})
   * ]], false);
   *
   * // When asked, send the keyboard
   * core.regex(/keyboard/i, $ => {
   *    $.keyboard(kbd);
   *    $.text('Here it is!');
   * });
   *
   * // -------> EXACT PAYLOAD
   * core.payload({a: 'b'}, $ => {
   *    $.text('Received secret payload!');
   * });
   *
   * // -------> DYNAMIC PAYLOAD
   * // In this case, the handler will run only if the
   * // payload's property `c` contains the value `d`.
   * core.payload((payload, parsed) => {
   *    if (parsed) { // If the payload is a valid JSON
   *      return parsed.c === 'd';
   *    } else {
   *      return false;
   *    }
   * }, $ => {
   *    $.text(`In message '${$.msg}', payload.c is 'd'!`);
   * });
   *
   */
  payload(payload, callback) {
    if (this.isLocked()) return;

    requireParam('Core#payload', payload, 'target payload');
    requireParam('Core#payload', callback, 'callback');
    requireFunction(callback);

    if (typeof payload !== 'function') {
      // Exact payload match:

      if (!this.exactPayloadHandlers[JSON.stringify(payload)]) {
        this.exactPayloadHandlers[JSON.stringify(payload)] = callback;
      } else {
        log().e(`Cannot register a handler: duplicate handler for payload '${payload}'`).from('core').now();
      }
    } else {
      // Dynamic payload match:

      this.dynPayloadHandlers.push({
        tester: payload,
        callback,
      });
    }
  }

  /**
   * Registers a command handler
   *
   * Handler is called if the message begins with `cmd_prefix`
   * (defined in the parameters) **+** `command`
   *
   * @param {string} command - command
   * @param {handler} callback - function, which will handle the message
   * @param {string} [description = ""] - the description of what this command does,
   * to be used in help messages
   *
   * @memberof Core
   * @instance
   *
   * @example
   * core.cmd('help', $ => {
   *   // core.help() returns the help message
   *   $.text('Test Bot' + core.help());
   * }, 'shows the help message');
   */
  cmd(command, callback, description = '') {
    if (this.isLocked()) return;

    requireParam('Core#cmd', command, 'command');
    requireParam('Core#cmd', callback, 'callback');
    requireFunction(callback);

    this.commandHandlers.push({
      command,
      description,
      callback,
    });
  }

  /**
   * Registers a regex handler
   *
   * @param {RegExp} regex - regular expression
   * @param {handler} callback - function, which will handle the message
   *
   * @memberof Core
   * @instance
   *
   * @example
   * core.regex(/h(i|ello|ey)/i, $ => {
   *    $.text('Hello, I am a test bot. You said: ' + $.msg);
   * });
   */
  regex(regex, callback) {
    if (this.isLocked()) return;

    requireParam('Core#regex', regex, 'regular expression');
    requireParam('Core#regex', callback, 'callback');
    requireFunction(callback);

    this.regexHandlers.push({
      regex,
      callback,
    });
  }

  /**
   * Parses the request, creates a `Context`, and proceeds
   * to call `Core#event` to handle the event
   *
   * @memberof Core
   * @instance
   *
   * @param {Object} body - body of the request, in parsed JSON
   *
   */
  async parseRequest(body) {
    const obj = body.object;
    const event = body.type;

    const $ = new Context(this.api, event, obj, obj.text);
    await this.event(event, $);
  }

  /**
   * Handles an event
   *
   *
   * @memberof Core
   * @instance
   *
   * @param {string} name - event name
   * @param {Context} $ - context object
   */
  async event(name, $) {
    this.stats.event(name);

    if (this.eventHandlers[name]) {
      try {
        await this.eventHandlers[name]($);

        if ($.autoSend && name !== 'message_new') {
          await $.send();
        }
      } catch (error) {
        log().w(`Error in handler: ${error}`).from('core').now();

        if (name !== 'handler_error') {
          await this.event('handler_error', $);
        }
      }
    } else if (this.eventWarnings) {
      log().w(`No handler for event '${name}'`).from('core').now();
    }
  }

  /**
   * Registers a handler for `message_new` event
   *
   * @memberof Core
   * @instance
   */
  registerMessageNewHandler() {
    this.on('message_new', async ($) => {
      // Check for 'service_action' event
      if ($.obj.action) {
        await this.event('service_action', $);
        return;
      }

      // Handle regular message
      if (!await this.tryHandlePayload($)) {
        if (!await this.tryHandleCommand($)) {
          if (!await this.tryHandleRegex($)) {
            log().w(`Don't know how to respond to ${JSON.stringify($.msg).replace(/\n/g, '\\n')}, calling 'no_match' event`).from('core').now();
            await this.event('no_match', $);
            return;
          }
        }
      }

      if ($.autoSend) await $.send();
    });
  }

  /**
   * Tries to handle the message in the given `Context`
   * with a payload handler
   *
   *
   * @memberof Core
   * @instance
   *
   * @param {Context} $ - context object
   *
   * @return {boolean} was the message handled?
   */
  async tryHandlePayload($) {
    const { payload } = $.obj;
    if (payload) {
      // Check for 'start' event
      try {
        if (JSON.parse(payload).command === 'start') {
          await this.event('start', $);
          $.noAutoSend(); // Message sending was already handled by event
          return true;
        }
      } catch (e) { /* JSON Parse Error */ }

      // Check for exact payload handler
      if (this.exactPayloadHandlers[payload]) {
        await this.exactPayloadHandlers[payload]($);
        return true;
      }

      // Check for dynamic payload handler
      const handlers = this.dynPayloadHandlers.map((potentialHandler) => {
        let parsed = null;
        try {
          parsed = JSON.parse(payload);
        } catch (e) { /* JSON Parse Error */ }

        if (potentialHandler.tester(payload, parsed)) {
          return potentialHandler;
        }

        return null;
      }).filter(e => e);

      if (handlers) {
        await handlers[0].callback($);
        return true;
      }
    }

    return false;
  }

  /**
   * Tries to handle the message in the given `Context`
   * with a command handler
   *
   *
   * @memberof Core
   * @instance
   *
   * @param {Context} $ - context object
   *
   * @return {boolean} was the message handled?
   */
  async tryHandleCommand($) {
    const handlerObjs = this.commandHandlers.map((potentialHandler) => {
      const cmd = escapeRegex(potentialHandler.command);
      const cmdRegex = new RegExp(`^( *\\[club${this.groupId}\\|.*\\])?( *${this.escapedCmdPrefix}${cmd})+`, 'i');

      if (cmdRegex.test($.msg)) {
        return {
          handler: potentialHandler,
          msg: $.msg.replace(cmdRegex, ''),
        };
      }

      return null;
    }).filter(e => e);

    if (handlerObjs) {
      const { handler, msg } = handlerObjs[0];

      $.msg = msg; // eslint-disable-line no-param-reassign
      await handler.callback($);
      return true;
    }

    return false;
  }

  /**
   * Tries to handle the message in the given `Context`
   * with a regex handler
   *
   *
   * @memberof Core
   * @instance
   *
   * @param {Context} $ - context object
   *
   * @return {boolean} was the message handled?
   */
  async tryHandleRegex($) {
    const handlers = this.regexHandlers.filter(
      potentialHandler => potentialHandler.regex.test($.msg),
    );

    if (handlers.length > 0) {
      await handlers[0].callback($);
      return true;
    }

    return false;
  }

  /**
   * Generates the help message
   *
   * @memberof Core
   * @instance
   */
  generateHelpMessage() {
    let helpMessage = '\n';

    this.commandHandlers.forEach((handler) => {
      let helpEntry = '';

      helpEntry += this.cmdPrefix;
      helpEntry += handler.command;

      if (handler.description) {
        helpEntry += ' - ';
        helpEntry += handler.description;
      }

      helpMessage += `${helpEntry}\n`;
    });

    this.helpMessage = helpMessage;
  }

  /**
   * Returns the help message
   *
   * @return {string} the help message
   *
   * @memberof Core
   * @instance
   */
  help() {
    return this.helpMessage;
  }
}

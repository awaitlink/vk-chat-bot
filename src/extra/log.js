/**
 * @file A part of `vk-chat-bot` node.js framework.
 * Defines the [log module]{@link module:log}.
 *
 * @author Artem Varaksa <aymfst@gmail.com>
 * @copyright Artem Varaksa 2017-2018
 */

/**
 * Logging utilities
 * @module log
 */

const chalk = require('chalk')

/**
 * Types of log messages
 *
 * @type {Object}
 * @readonly
 * @property {string} information the informational message type
 * @property {string} warning the warning type
 * @property {string} error the error type
 * @property {string} response the response type
 */
export var types = {
  information: chalk.blue('info'),
  warning: chalk.bold.yellow('warn'),
  error: chalk.bold.red('err!'),
  response: chalk.green('resp')
}

/**
 * Spacing of the message source
 *
 * @type {number}
 */
const SRC_SPACING = 5

/**
 * Shortcut for `new LogMessageBuilder()`.
 * @return {LogMessageBuilder}
 * @function log
 */
export function log () {
  return new LogMessageBuilder()
}

class LogMessageBuilder {
  /**
   * @class LogMessageBuilder
   * @classdesc
   * Provides a convenient way for logging things.
   * @return {LogMessageBuilder} for chaining
   */
  constructor () {
    /**
     * The source of the message
     *
     * @private
     * @type {string}
     * @memberof module:log~LogMessageBuilder
     */
    this._from = 'log'

    /**
     * The type of the message
     *
     * @private
     * @type {string}
     * @memberof module:log~LogMessageBuilder
     */
    this._type = types.information

    /**
     * The text of the message
     *
     * @private
     * @type {string}
     * @memberof module:log~LogMessageBuilder
     */
    this._text = ''
  }

  /**
   * Sets the source of the message
   * @param {string} f the source of the message
   *
   * @memberof module:log~LogMessageBuilder
   * @instance
   * @return {LogMessageBuilder} for chaining
   * @method from
   */
  from (f) {
    this._from = f
    return this
  }

  /**
   * Sets the type of the message
   * @param {string} t the type of the message
   *
   * @memberof module:log~LogMessageBuilder
   * @instance
   * @return {LogMessageBuilder} for chaining
   * @method type
   */
  type (t) {
    this._type = t
    return this
  }

  /**
   * Sets the text of the message
   * @param {string|Error} t the text of the message. If passed an `Error`,
   * the `message` property of the error will be used
   *
   * @memberof module:log~LogMessageBuilder
   * @instance
   * @return {LogMessageBuilder} for chaining
   * @method text
   */
  text (t) {
    if (t instanceof Error) {
      this._text = t.message
    } else {
      this._text = t
    }

    return this
  }

  /**
   * Logs the message now.
   *
   * @memberof module:log~LogMessageBuilder
   * @instance
   * @return {LogMessageBuilder} for chaining
   * @method now
   */
  now () {
    this._log()
    return this
  }

  /**
   * Logs the message.
   *
   * @private
   * @memberof module:log~LogMessageBuilder
   * @instance
   * @method _log
   */
  _log () {
    if (this._text === '') return
    if (process.env.TEST_MODE && this._type !== types.error) return

    var spacing = ''
    for (var i = 0; i < (SRC_SPACING - this._from.length); i++) spacing += ' '

    var message = `${spacing}${this._from} ${this._type} ${this._text}`

    if (this._type === types.error) {
      throw new Error(message)
    } else {
      console.log(message)
    }
  }

  /**
   * Convenience method for logging information.
   * Sets the type to {@link types.message} and also the text of the message.
   * @param {string|Error} t the text of the message. If passed an `Error`,
   * the `message` property of the error will be used
   *
   * @memberof module:log~LogMessageBuilder
   * @instance
   * @return {LogMessageBuilder} for chaining
   * @method i
   */
  i (t) {
    this.type(types.information)
    return this.text(t)
  }

  /**
   * Convenience method for logging warnings.
   * Sets the type to {@link types.warning} and also the text of the message.
   * @param {string|Error} t the text of the message. If passed an `Error`,
   * the `message` property of the error will be used
   *
   * @memberof module:log~LogMessageBuilder
   * @instance
   * @return {LogMessageBuilder} for chaining
   * @method w
   */
  w (t) {
    this.type(types.warning)
    return this.text(t)
  }

  /**
   * Convenience method for logging errors.
   * Sets the type to {@link types.error} and also the text of the message.
   * @param {string|Error} t the text of the message. If passed an `Error`,
   * the `message` property of the error will be used
   *
   * @memberof module:log~LogMessageBuilder
   * @instance
   * @return {LogMessageBuilder} for chaining
   * @method e
   */
  e (t) {
    this.type(types.error)
    return this.text(t)
  }

  /**
   * Convenience method for logging responses.
   * Sets the type to {@link types.response} and also the text of the message.
   * @param {string|Error} t the text of the message. If passed an `Error`,
   * the `message` property of the error will be used
   *
   * @memberof module:log~LogMessageBuilder
   * @instance
   * @return {LogMessageBuilder} for chaining
   * @method r
   */
  r (t) {
    this.type(types.response)
    return this.text(t)
  }
}

/**
 * Tests if the parameter is ok, and if it is not, logs an error
 *
 * @param {string} functionName name of the function which this param is required for
 * @param {*} param the parameter to test
 * @param {string} name name of this param in the function requiring it
 */
export function requireParam (functionName, param, name) {
  if (!param) {
    if (name) {
      log().e(`In function '${functionName}': expected: '${name}', got: '${param}'.`).now()
    } else {
      log().e(`Bad parameter for function '${functionName}': '${param}'.`).now()
    }
  }
}

/**
 * Tests if the parameter is a function, and if it is not, logs an error
 *
 * @param {*} param the parameter to test
 */
export function requireFunction (param) {
  if (typeof param !== 'function') {
    log().e(`Callback function that you specified is not a function.`).now()
  }
}

/**
 * @file A part of `vk-chat-bot` node.js framework
 * @author Artem Varaksa <aymfst@gmail.com>
 * @copyright Artem Varaksa 2017-2018
 */

/**
 * Logging utilities
 * @module extra/log
 */

require('colors')

/**
 * Types of log messages
 *
 * @type {Object}
 * @readonly
 * @property {string} info the informational message type
 * @property {string} warn the warning type
 * @property {string} res the response type
 * @property {string} err the error type
 */
export var types = {
  info: 'info'.blue,
  warn: 'warn'.yellow,
  res: 'resp'.green,
  err: 'err!'.red
}

/**
 * Spacing of the message source
 *
 * @type {number}
 */
const SRC_SPACING = 5

/**
 * Logs the message to the console
 * @function log
 *
 * @param {string} src source of the log message
 * @param {string} type type of the log message
 * @param {string} text the log message
 *
 * @throws {Error} if type is `types.err`
 */
export default function log (src, type, text) {
  if (text === '') return
  if (process.env.TEST_MODE && type !== types.err) return

  var spacing = ''
  for (var i = 0; i < (SRC_SPACING - src.length); i++) spacing += ' '

  var message = `${spacing}${src} ${type} ${text}`

  if (type === types.err) {
    throw new Error(message)
  } else {
    console.log(message)
  }
}

/**
 * Logs an info message to the console
 * @function info
 *
 * @param {string} src source of the log message
 * @param {string} info the log message
 */
export function info (src, info) {
  log(src, types.info, info)
}

/**
 * Logs a warn message to the console
 * @function warn
 *
 * @param {string} src source of the log message
 * @param {string} info the log message
 */
export function warn (src, info) {
  if (info instanceof Error) {
    info = info.message
  }

  log(src, types.warn, info)
}

/**
 * Logs an error message to the console, with some additional messages
 * @function err
 *
 * @param {string} src source of the log message
 * @param {string|Error} reason the log message
 */
export function err (src, reason) {
  if (reason instanceof Error) {
    reason = reason.message
  }

  if (!process.env.TEST_MODE) {
    var note = `[⋅] An error occured. The messages below may contain
[⋅] useful information about the problem.
[⋅] If you think this is an issue with 'vk-chat-bot' itself,
[⋅] please report it at <https://github.com/u32i64/vk-chat-bot/issues>.`.inverse

    console.log(`\n\n${note}\n\n`)
  }

  log(src, types.err, reason)
}

/**
 * Logs a response message to the console
 * @function res
 *
 * @param {string} src source of the log message
 * @param {string} info the log message
 */
export function res (src, info) {
  log(src, types.res, info)
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
      err('log', `In function '${functionName}': expected: '${name}', got: '${param}'.`)
    } else {
      err('log', `Bad parameter for function '${functionName}': '${param}'.`)
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
    err('log', `Callback function that you specified is not a function.`)
  }
}

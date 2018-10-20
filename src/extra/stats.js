/**
 * @file A part of `vk-chat-bot` node.js framework
 * @author Artem Varaksa <aymfst@gmail.com>
 * @copyright Artem Varaksa 2017-2018
 */

/**
 * @module extra/stats
 */

import { info } from './log'
require('colors')

const moment = require('moment')
require('moment-duration-format')(moment)

export default class Stats {
  /**
   * @class Stats
   *
   * @return {Stats}
   *
   * @classdesc
   * Stats stores and prints statistics.
   *
   * The bot logs statistics each **~10s** (if they changed):
   *
   *  ```console
   *   stat info [12y 34d 12h 34m 56s] rx:32 tx:16 | allow/deny:5/0 typing:3 new:7(start:2 action:1) edit:1 | reply:16 | no_match:0 err:0
   *  ```
   *
   * ### General statistics
   *
   * Statistics | Description
   * --- | ---
   * `[...]` | Process uptime
   * `rx` | Amount of received events from Callback API
   * `tx` | Amount of sent messages
   *
   * ### Callback API event statistics
   * Statistics | Description
   * --- | ---
   * `new` | `message_new` events
   * `allow` | `message_allow` events
   * `deny` | `message_deny` events
   * `edit` | `message_edit` events
   * `reply` | `message_reply` events
   * `typing` | `message_typing_state` events
   *
   * ### Other event statistics
   * Statistics | Description
   * --- | ---
   * `start` | `start` events
   * `action` | `service_action` events
   * `no_match` | `no_match` events
   * `err` | `handler_error` events
   *
   */
  constructor () {
    /**
     * Count of requests from the Callback API
     *
     * @private
     * @type {number}
     * @memberof module:extra/stats~Stats
     */
    this.rx = 0

    /**
     * Count of messages sent
     *
     * @private
     * @type {number}
     * @memberof module:extra/stats~Stats
     */
    this.tx = 0

    /**
     * Count of various events
     *
     * @private
     * @type {Object}
     * @memberof module:extra/stats~Stats
     */
    this.eventCounters = {
      message_new: 0,
      message_reply: 0,
      message_edit: 0,
      message_typing_state: 0,
      message_allow: 0,
      message_deny: 0,

      start: 0,
      service_action: 0,

      no_match: 0,
      handler_error: 0
    }

    /**
     * Previous stats log message, without time
     *
     * @private
     * @type {string}
     * @memberof module:extra/stats~Stats
     */
    this.previous = ''

    if (!process.env.TEST_MODE) {
      info('stat', 'Stats initialized')

      setInterval(() => {
        this.print()
      }, 10000)
    }
  }

  /**
   * This is used to tell `Stats` that a message was sent
   * @instance
   * @memberof module:extra/stats~Stats
   */
  sent () {
    this.tx++
  }

  /**
   * This is used to tell `Stats` that an event was emitted
   * @instance
   * @memberof module:extra/stats~Stats
   *
   * @param {string} name - the event name
   */
  event (name) {
    this.rx++
    this.eventCounters[name]++

    var internalEvents = ['start', 'service_action', 'no_match', 'handler_error']
    if (internalEvents.includes(name)) {
      this.rx-- // Not from Callback API
    }
  }

  /**
   * How much events of this type were emitted?
   * @instance
   * @memberof module:extra/stats~Stats
   *
   * @param {string} name - the name of the event you're curious about
   *
   * @return {string} the count
   */
  getEventCount (name) {
    return this.eventCounters[name].toString()
  }

  /**
   * Prints the statistics if they changed
   * @instance
   * @memberof module:extra/stats~Stats
   */
  print () {
    var rx = this.rx.toString().green
    var tx = this.tx.toString().cyan

    var mn = this.getEventCount('message_new').green
    var ma = this.getEventCount('message_allow').green
    var md = this.getEventCount('message_deny').red
    var me = this.getEventCount('message_edit').green
    var mr = this.getEventCount('message_reply').cyan
    var mts = this.getEventCount('message_typing_state').green

    var st = this.getEventCount('start').green
    var sa = this.getEventCount('service_action').green

    var nm = this.getEventCount('no_match').magenta
    var he = this.getEventCount('handler_error').magenta

    var up = moment.duration(process.uptime(), 'seconds').format('y[y] d[d] h[h] m[m] s[s]')
    var message = `rx:${rx} tx:${tx} | allow/deny:${ma}/${md} typing:${mts} new:${mn}(start:${st} action:${sa}) edit:${me} | reply:${mr} | no_match:${nm} err:${he}`

    if (message === this.previous) {
      return
    } else {
      this.previous = message
    }

    message = `[${up}] ` + message

    info('stat', message)
  }
}

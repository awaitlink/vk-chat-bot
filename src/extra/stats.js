import {info} from './log'
require('colors')

const moment = require('moment')
require('moment-duration-format')(moment)

export default class Stats {
  constructor () {
    this.rx = 0 // requests from the Callback API
    this.tx = 0 // messages sent

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

    this.previous = ''

    if (!process.env.TEST_MODE) {
      info('stat', 'Stats initialized')

      setInterval(() => {
        this.print()
      }, 10000)
    }
  }

  sent () {
    this.tx++
  }

  event (name) {
    this.rx++
    this.eventCounters[name]++

    var internalEvents = ['start', 'service_action', 'no_match', 'handler_error']
    if (internalEvents.includes(name)) {
      this.rx-- // Not from Callback API
    }
  }

  getEventCount (name) {
    return this.eventCounters[name].toString()
  }

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

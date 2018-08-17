import {info} from './log'
require('colors')

export default class Stats {
  constructor () {
    this.rx = 0 // requests from the Callback API
    this.tx = 0 // messages sent

    this.eventCounters = {
      'message_new': 0,
      'message_reply': 0,
      'message_edit': 0,
      'message_typing_state': 0,
      'message_allow': 0,
      'message_deny': 0,

      'no_match': 0,
      'handler_error': 0
    }

    this.previous = ''

    if (!process.env.TEST_MODE) {
      info('Stats initialized')

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

    if ((name === 'no_match') || (name === 'handler_error')) {
      this.rx-- // Not from Callback API
    }
  }

  print () {
    var rx = this.rx.toString().green
    var tx = this.tx.toString().cyan

    var mn = this.eventCounters['message_new'].toString().green
    var ma = this.eventCounters['message_allow'].toString().green
    var md = this.eventCounters['message_deny'].toString().red
    var me = this.eventCounters['message_edit'].toString().green
    var mr = this.eventCounters['message_reply'].toString().cyan
    var mts = this.eventCounters['message_typing_state'].toString().green

    var nm = this.eventCounters['no_match'].toString().magenta
    var he = this.eventCounters['handler_error'].toString().magenta

    var hash = `${rx}|${tx}|${ma}/${md}|${mts}|${mn}|${me}|${mr}|${nm}|${he}`

    if (hash === this.previous) {
      return
    } else {
      this.previous = hash
    }

    var up = process.uptime().toString()
    var message = `[up:${up}s] rx:${rx} tx:${tx} | allow/deny:${ma}/${md} typing:${mts} new:${mn} edit:${me} reply:${mr} | no_match:${nm} err:${he}`

    console.log(message)
  }
}

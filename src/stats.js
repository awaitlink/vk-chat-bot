require('colors')

class Stats {
  constructor () {
    this.rx = 0 // requests from the Callback API
    this.tx = 0 // messages sent

    this.mn = 0 // message_new
    this.ma = 0 // message_allow
    this.md = 0 // message_deny
    this.me = 0 // message_edit
    this.mr = 0 // message_reply
    this.mts = 0 // message_typing_state

    this.nm = 0 // no_match

    this.previous = ''

    this.print()

    setInterval(() => {
      this.print()
    }, 10000)
  }

  sent () {
    this.tx++
  }

  event (name) {
    this.rx++

    switch (name) {
      case 'message_new':
        this.mn++
        break
      case 'message_allow':
        this.ma++
        break
      case 'message_deny':
        this.md++
        break
      case 'message_edit':
        this.me++
        break
      case 'message_reply':
        this.mr++
        break
      case 'message_typing_state':
        this.mts++
        break
      case 'no_match':
        this.rx-- // Not from Callback API
        this.nm++
        break
    }
  }

  print () {
    var rx = this.rx.toString().green
    var tx = this.tx.toString().cyan

    var mn = this.mn.toString().green
    var ma = this.ma.toString().green
    var md = this.md.toString().red
    var me = this.me.toString().green
    var mr = this.mr.toString().cyan
    var mts = this.mts.toString().green

    var nm = this.nm.toString().magenta

    var hash = `${rx}|${tx}|${ma}/${md}|${mts}|${mn}|${me}|${mr}|${nm}`

    if (hash === this.previous) {
      return
    } else {
      this.previous = hash
    }

    var up = process.uptime().toString()
    var message = `[up:${up}s] rx:${rx} tx:${tx} | allow/deny:${ma}/${md} typing:${mts} new:${mn} edit:${me} reply:${mr} | no match ${nm}`

    console.log(message)
  }
}

module.exports = Stats

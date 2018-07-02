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
    var rx = this.rx.toString().black.bgGreen
    var tx = this.tx.toString().black.bgCyan

    var mn = this.mn.toString().green
    var ma = this.ma.toString().green
    var md = this.md.toString().green
    var me = this.me.toString().green
    var mr = this.mr.toString().green
    var mts = this.mts.toString().green

    var nm = this.nm.toString().magenta

    var up = process.uptime().toString()

    var message = `[up: ${up}s] rx: ${rx} tx: ${tx} evt: mn ${mn} ma ${ma} md ${md} me ${me} mr ${mr} mts ${mts} nm ${nm}`

    console.log(message)
  }
}

module.exports = Stats

var colors = require('colors');

class Log {
  constructor () {
    this.type = {
      information: 'i',
      request: '>',
      response: '<',
      error: '!'
    }
  }

  log (type, text) {
    var text = `[${type}] ${text}`

    switch (type) {
      case this.type.information:
        text = text.green
        break
      case this.type.error:
        text = text.red
        break
    }

    console.log(text)
  }

  error (reason) {
    var note = `[⋅] An error occured. The messages below may contain
[⋅] useful information about the problem.
[⋅] If you believe this is vk-chat-bot's fault,
[⋅] please report the issue at <https://github.com/u32i64/vk-chat-bot/issues>.`.inverse

    console.log(`\n\n${note}\n\n`)

    throw new Error(`[${this.type.error}] ${reason}`.red)

    // process.exitCode = 1
  }

  requireParam (functionName, param, name) {
    if (!param) {
      if (name) {
        this.error(`In function '${functionName}': expected: '${name}', got: '${param}'.`)
      } else {
        this.error(`Bad parameter for function '${functionName}': '${param}'.`)
      }
    }
  }

  requireFunction (param) {
    if (typeof param !== 'function') {
      this.error(`Callback function that you specified is not a function.`)
    }
  }
}

module.exports = Log

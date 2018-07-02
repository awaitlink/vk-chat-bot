require('colors')

class Log {
  constructor () {
    this.type = {
      information: 'i',
      warning: '!',
      response: '<',
      error: '!!'
    }
  }

  log (type, text) {
    var message = `[${type}] ${text}`

    switch (type) {
      case this.type.information:
        message = message.green
        break
      case this.type.warning:
        message = message.yellow
        break
      case this.type.error:
        message = message.red
        throw new Error(message)
    }

    console.log(message)
  }

  info (info) {
    this.log(this.type.information, info)
  }

  warn (info) {
    this.log(this.type.warning, info)
  }

  error (reason) {
    var note = `[⋅] An error occured. The messages below may contain
[⋅] useful information about the problem.
[⋅] If you believe this is vk-chat-bot's fault,
[⋅] please report the issue at <https://github.com/u32i64/vk-chat-bot/issues>.`.inverse

    console.log(`\n\n${note}\n\n`)
    this.log(this.type.error, reason)

    // process.exitCode = 1
  }

  res (info) {
    this.log(this.type.response, info)
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

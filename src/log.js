class Log {
  constructor () {
    this.type = {
      information: 'i',
      request: '>',
      response: '<',
      error: '!'
    }
  }

  getLogMessage (type, text) {
    return `[${type}] ${text}`
  }

  log (type, text) {
    console.log(this.getLogMessage(type, text))
  }

  terminate () {
    throw new Error(this.getLogMessage(this.type.error, `Terminating. See above for more information.`))
  }

  badParams (functionName) {
    throw new Error(this.getLogMessage(this.type.error, `Bad parameters for function ${functionName}().`))
  }

  requireParams (functionName, ...params) {
    for (let param of params) {
      if (!param) {
        this.badParams(functionName)
      }
    }
  }

  requireFunction (param) {
    if (typeof param !== 'function') {
      throw new Error(this.getLogMessage(this.type.error, `Callback function you specified is not a function.`))
    }
  }
}

module.exports = Log

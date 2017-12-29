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

  requireParams (functionName, ...params) {
    var i = 0
    for (let param of params) {
      if (!param) {
        throw new Error(this.getLogMessage(
          this.type.error,
          `Bad parameter #${i} for function ${functionName}(): '${param}'.`
        ))
      }

      i++
    }
  }

  requireFunction (param) {
    if (typeof param !== 'function') {
      throw new Error(this.getLogMessage(this.type.error, `Callback function you specified is not a function.`))
    }
  }
}

module.exports = Log

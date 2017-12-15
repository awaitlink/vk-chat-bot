class Log {
  constructor(){
    this.type = {
      information: 'i',
      request: '>',
      response: '<',
      error: '!'
    };
  }

  getLogMessage(type, text) {
    return `[${type}] ${text}`;
  }

  log(type, text) {
    console.log(this.getLogMessage(type, text));
  }

  terminate() {
    throw new Error(this.getLogMessage(this.type.error, `Terminating. See above for more information.`));
  }

  badParams(functionName) {
    throw new Error(this.getLogMessage(this.type.error, `Bad parameters for function ${functionName}().`));
  }
}

module.exports = Log;

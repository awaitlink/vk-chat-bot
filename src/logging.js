exports.type = {
  information: 'i',
  request: '>',
  response: '<',
  error: '!'
};

function getLogMessage(type, text) {
  return `[${type}] ${text}`;
}

exports.log = function(type, text) {
  console.log(getLogMessage(type, text));
};

exports.terminate = function() {
  throw new Error(getLogMessage(exports.type.error, `Terminating. See above for more information.`));
};

exports.badParams = function(functionName) {
  throw new Error(getLogMessage(exports.type.error, `Bad parameters for function ${functionName}().`));
};

exports.type = {
  information: 'i',
  request: '>',
  response: '<',
  error: '!'
};

exports.log = function(type, text) {
  message = `[${type}] ${text}`
  console.log(message);
};

exports.terminate = function() {
  exports.log(exports.type.error, 'Terminating.');
  process.exit(1);
};

exports.badParams = function(functionName) {
  exports.log(exports.type.error, 'Bad parameters for function ' + functionName + '().');
  exports.terminate();
};

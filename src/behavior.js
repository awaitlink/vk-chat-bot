const log = new (require('./log.js'))();
const API = require('./api.js');

var commandHandlers = [];
var regexHandlers = [];
var eventHandlers = [];
var possibleEvents = ["message_allow", "message_deny", "message_reply", "no_match"];

var cmdPrefix = null;
var api;

exports.setCmdPrefix = function (prefix) {
  cmdPrefix = prefix;
}

exports.initAPI = function (key) {
  api = new API(key);
}

// On exact command with prefix
exports.cmd = function (command, a, b) {
  if (!command || !a) {
    // At least a should be defined
    log.badParams("cmd");
  }

  var description = a;
  var callback = b;
  if (!b) {
    // We have only command and callback
    description = null;
    callback = a;
  }

  commandHandlers.push({
    command: command,
    description: description,
    callback: callback
  });
};

// On matching regex
exports.regex = function (regex, callback) {
  if (!regex || !callback) {
    log.badParams("regex");
  }

  regexHandlers.push({
    regex: regex,
    callback: callback
  });
};

// For special events
exports.on = function (e, callback) {
  if (!e || !callback) {
    log.badParams("on");
  }

  if (!possibleEvents.includes(e)) {
    log.log(log.type.error, 'Tried to register a handler for an unsupported event type: ' + e);
    log.terminate();
  }

  eventHandlers.push({
    event: e,
    callback: callback
  });
};

// Parse Callback API's message
exports.parseRequest = function(body) {
  uid = body.object.user_id;
  obj = body.object;
  type = body.type;
  if (type === "message_new") {
    log.log(log.type.request, 'New message from user: ' + uid);
    handleMessage(uid, obj);
  } else {
    log.log(log.type.request, 'Received event: ' + type);
    handleEvent(uid, type, obj);
  }
}

// Handle message_new
function handleMessage(uid, obj) {
  msg = obj.body.toLocaleLowerCase();

  var command = msg.split(" ")[0];
  if (cmdPrefix) command = command.replace(cmdPrefix, "");

  // See if there is a matching command
  for (var i = 0; i < commandHandlers.length; i++) {
    handler = commandHandlers[i];
    if (handler.command === command) {
      regex = new RegExp(command, 'g');
      if (cmdPrefix) regex = new RegExp(cmdPrefix + command, 'g');

      msg_content = obj.body.replace(regex, "");

      var answer = handler.callback(msg_content, obj);
      if (answer != null) {
       api.send(uid, answer);
      }

      return;
    }
  }

  // If not, try to use a regex handler
  for (var i = 0; i < regexHandlers.length; i++) {
    handler = regexHandlers[i];
    if ((new RegExp(handler.regex)).test(msg)) {
      var answer = handler.callback(obj.body, obj);
      if (answer != null) {
       api.send(uid, answer);
      }

      return;
    }
  }

  // If not, call the no_match event
  log.log(log.type.information, "Don't know how to respond to: \"" + msg + "\", calling 'no_match' event");
  handleEvent(uid, "no_match", obj);
}

// Handle a special event
function handleEvent(uid, e, obj) {
  if (!possibleEvents.includes(e) ) {
    log.log(log.type.error, 'Received an unsupported event type: ' + e);
    return;
  }

  for (var i = 0; i < eventHandlers.length; i++) {
    handler = eventHandlers[i];
    if (handler.event === e) {
      var answer = handler.callback(uid, obj);
      if (answer != null && !(e === "message_deny")) {
       api.send(uid, answer);
      }
      return;
    }
  }

  log.log(log.type.information, "No handler for event: " + e);
}

exports.help = function () {
  var helpMessage = "\n";

  for (var i = 0; i < commandHandlers.length; i++) {
    var commandHelpEntry = "";

    commandHelpEntry += cmdPrefix;
    commandHelpEntry += commandHandlers[i].command;

    if (commandHandlers[i].description) {
      commandHelpEntry += " - ";
      commandHelpEntry += commandHandlers[i].description;
    }

    helpMessage += commandHelpEntry + "\n";
  }

  return helpMessage;
};

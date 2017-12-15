const log = new (require('./log.js'))();
const API = require('./api.js');

class Behavior {
  constructor(vkApiKey, cmdPrefix) {
    this.api = new API(vkApiKey);
    this.cmdPrefix = cmdPrefix;

    this.isInTestMode = vkApiKey == "test";

    this.commandHandlers = [];
    this.regexHandlers = [];
    this.eventHandlers = [];
    this.possibleEvents = ["message_allow", "message_deny", "message_reply", "no_match"];
  }

  // On exact command with prefix
  cmd(command, a, b) {
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

    this.commandHandlers.push({
      command: command,
      description: description,
      callback: callback
    });
  }

  // On matching regex
  regex(regex, callback) {
    if (!regex || !callback) {
      log.badParams("regex");
    }

    this.regexHandlers.push({
      regex: regex,
      callback: callback
    });
  }

  // For special events
  on(e, callback) {
    if (!e || !callback) {
      log.badParams("on");
    }

    if (!this.possibleEvents.includes(e)) {
      log.log(log.type.error, 'Tried to register a handler for an unsupported event type: ' + e);
      log.terminate();
    }

    this.eventHandlers.push({
      event: e,
      callback: callback
    });
  }

  // Parse Callback API's message
  parseRequest(body) {
    uid = body.object.user_id;
    obj = body.object;
    type = body.type;
    if (type === "message_new") {
      log.log(log.type.request, 'New message from user: ' + uid);
      this.handleMessage(uid, obj);
    } else {
      log.log(log.type.request, 'Received event: ' + type);
      this.handleEvent(uid, type, obj);
    }
  }

  // Handle message_new
  handleMessage(uid, obj) {
    msg = obj.body.toLocaleLowerCase();

    var command = msg.split(" ")[0];
    if (this.cmdPrefix) command = command.replace(this.cmdPrefix, "");

    // See if there is a matching command
    for (var i = 0; i < this.commandHandlers.length; i++) {
      handler = this.commandHandlers[i];
      if (handler.command === command) {
        regex = new RegExp(command, 'g');
        if (this.cmdPrefix) regex = new RegExp(this.cmdPrefix + command, 'g');

        msg_content = obj.body.replace(regex, "");

        var answer = handler.callback(msg_content, obj);
        if (answer != null) {
         this.api.send(uid, answer);
        }

        return;
      }
    }

    // If not, try to use a regex handler
    for (var i = 0; i < this.regexHandlers.length; i++) {
      handler = this.regexHandlers[i];
      if ((new RegExp(handler.regex)).test(msg)) {
        var answer = handler.callback(obj.body, obj);
        if (answer != null) {
         this.api.send(uid, answer);
        }

        return;
      }
    }

    // If not, call the no_match event
    log.log(log.type.information, "Don't know how to respond to: \"" + msg + "\", calling 'no_match' event");
    this.handleEvent(uid, "no_match", obj);
  }

  // Handle a special event
  handleEvent(uid, e, obj) {
    if (!this.possibleEvents.includes(e) ) {
      log.log(log.type.error, 'Received an unsupported event type: ' + e);
      return;
    }

    for (var i = 0; i < this.eventHandlers.length; i++) {
      handler = this.eventHandlers[i];
      if (handler.event === e) {
        var answer = handler.callback(uid, obj);
        if (answer != null && !(e === "message_deny")) {
         this.api.send(uid, answer);
        }
        return;
      }
    }

    log.log(log.type.information, "No handler for event: " + e);
  }

  help() {
    var helpMessage = "\n";

    for (var i = 0; i < this.commandHandlers.length; i++) {
      var commandHelpEntry = "";

      commandHelpEntry += this.cmdPrefix;
      commandHelpEntry += this.commandHandlers[i].command;

      if (this.commandHandlers[i].description) {
        commandHelpEntry += " - ";
        commandHelpEntry += this.commandHandlers[i].description;
      }

      helpMessage += commandHelpEntry + "\n";
    }

    return helpMessage;
  }
}

module.exports = Behavior;

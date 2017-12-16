const log = new (require('./log.js'))();
const API = require('./api.js');
const APIBuffer = require('./api_buffer.js');

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
    var obj = body.object;
    var uid = obj.user_id;
    var type = body.type;

    if (type === "message_new") {
      log.log(log.type.request, 'New message from user: ' + uid);
      this.handleMessage(obj);
    } else {
      log.log(log.type.request, 'Received event: ' + type);
      this.handleEvent(type, obj);
    }
  }

  // Handles message_new
  handleMessage(obj) {
    var msg = obj.body;
    handleWithCommand(obj) || handleWithRegex(obj) || noMatchFound(obj);
  }

  handleWithCommand(obj) {
    var msg = obj.body;

    // See if there is a matching command
    for (var i = 0; i < this.commandHandlers.length; i++) {
      var cmdHandler = this.commandHandlers[i];
      var cmdRegex = new RegExp(`(${escapeRegex(this.cmdPrefix || "")}${escapeRegex(command)} )+`, 'gi');
      var cleanMessage = msg.replace(cmdRegex, "");

      if (cmdRegex.test(msg)) {
        var $ = new APIBuffer(this.api, "message_new", obj, cleanMessage);
        cmdHandler.callback($);
        $.send();

        return true;
      }
    }

    return false;
  }

  handleWithRegex(obj) {
    var msg = obj.body;

    // Try to use a regex handler
    for (var i = 0; i < this.regexHandlers.length; i++) {
      var regexHandler = this.regexHandlers[i];

      if (regexHandler.regex.test(msg)) {
        var $ = new APIBuffer(this.api, "message_new", obj, msg);
        regexHandler.callback($);
        $.send();

        return true;
      }
    }

    return false;
  }

  noMatchFound(obj){
    // Call the no_match event
    log.log(log.type.information, "Don't know how to respond to: \"" + msg + "\"; calling 'no_match' event");
    this.handleEvent("no_match", obj);
  }

  // Handle a special event
  handleEvent(e, obj) {
    if (!this.possibleEvents.includes(e) ) {
      log.log(log.type.error, 'Received an unsupported event type: ' + e);
      return;
    }

    for (var i = 0; i < this.eventHandlers.length; i++) {
      var eventHandler = this.eventHandlers[i];
      if (eventHandler.event === e) {
        var $ = new APIBuffer(this.api, e, obj, obj.body);
        eventHandler.callback($);
        $.send();

        return;
      }
    }

    log.log(log.type.information, "No handler found for event: " + e);
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

  static escapeRegex(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }
}

module.exports = Behavior;

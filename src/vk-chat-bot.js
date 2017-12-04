const app = require('express')();
const request = require('request');
const bodyParser = require('body-parser');

var groupId, confirmationToken, secret, vkApiKey;
var cmdPrefix;

var initialized = false;

var commandHandlers = [];
var regexHandlers = [];
var eventHandlers = [];
var possibleEvents = ["message_allow", "message_deny", "no_match"];

// Initialise the bot
exports.init = function (params) {
  if (!params) {
    badParams("init")
  }

  groupId = params.group_id;
  confirmationToken = params.confirmation_token;
  secret = params.secret;
  vkApiKey = params.vk_api_key;
  cmdPrefix = params.cmd_prefix;

  if (groupId && confirmationToken && secret && vkApiKey) {
    initialized = true;
  } else {
    badParams("init")
  }
};

// On exact command with prefix
exports.cmd = function (command, callback) {
  if (!command || !callback) {
    badParams("cmd")
  }

  commandHandlers.push({
    command: command,
    callback: callback
  });
};

// On matching regex
exports.regex = function (regex, callback) {
  if (!regex || !callback) {
    badParams("regex")
  }

  regexHandlers.push({
    regex: regex,
    callback: callback
  });
};

// For special events
exports.on = function (e, callback) {
  if (!e || !callback) {
    badParams("on")
  }

  if (!possibleEvents.includes(e)) {
    console.log('[!] Tried to register a handler for an unsupported event type: ', e);
    console.log('[!] Terminating.');
    process.exit(1);
  }

  eventHandlers.push({
    event: e,
    callback: callback
  });
};

// Start the bot
exports.start = function (port) {
  if (!port) {
    badParams("start")
  }

  if (!initialized) {
    console.log('[!] Please initialize the bot before starting it using init(params).');
    console.log('[!] Terminating.');
    process.exit(1);
  }

  app.use(bodyParser.json());

  app.get('/', (req, res) => {
    res.status(400).send('Only POST allowed.');
    console.log('[>] GET request.');
  })

  app.post('/', (req, res) => {
    body = req.body;

    if (body.type === "confirmation" && body.group_id == groupId) {
        res.status(200).send(confirmationToken);
    } else if (body.secret === secret) {
        res.status(200).send('ok');
        parseRequest(body);
    } else {
        res.status(400).send('Invalid secret key.');
        console.log('[>] Request with an invalid secret key.');
    }
  })

  app.listen(port, (err) => {
    if (err) return console.log('[!] Error: ', err);
    console.log(`[i] Server is listening on port ${port}.`);
  })
};

// Parse Callback API's message
function parseRequest(body) {
  if (body.type === "message_new") {
    uid = body.object.user_id;
    msg = body.object.body;
    console.log('[>] New message from user: ', uid);
    handleMessage(uid, msg);
  } else {
    uid = body.object.user_id;
    console.log('[>] Received event: ', body.type);
    handleEvent(uid, body.type);
  }
}

// Handle message_new
function handleMessage(uid, msg) {
  msg = msg.toLocaleLowerCase();

  var command = msg.split(" ")[0];
  if (cmdPrefix) command = command.replace(cmdPrefix, "");

  // See if there is a matching command
  for (var i = 0; i < commandHandlers.length; i++) {
    handler = commandHandlers[i];
    if (handler.command === command) {
      regex = new RegExp(command, 'g');
      if (cmdPrefix) regex = new RegExp(cmdPrefix + command, 'g');

      msg_content = msg.replace(regex, "");

      var answer = handler.callback(msg_content);
      if (answer != null) {
        send(uid, answer);
      }

      return;
    }
  }

  // If not, try to use a regex handler
  for (var i = 0; i < regexHandlers.length; i++) {
    handler = regexHandlers[i];
    if ((new RegExp(handler.regex)).test(msg)) {
      var answer = handler.callback(msg);
      if (answer != null) {
        send(uid, answer);
      }

      return;
    }
  }

  // If not, call the no_match event
  console.log("[i] Don't know how to respond to: \"" + msg + "\", calling 'no_match' event");
  handleEvent(uid, "no_match");
}

// Handle a special event
function handleEvent(uid, e) {
  if (!possibleEvents.includes(e) ) {
    console.log('[!] Received an unsupported event type: ', body.type);
    return;
  }

  for (var i = 0; i < eventHandlers.length; i++) {
    handler = eventHandlers[i];
    if (handler.event === e) {
      var answer = handler.callback(uid);
      if (answer != null && !(e === "message_deny")) {
        send(uid, answer);
      }
      return;
    }
  }

  console.log("[i] No handler for event: " + e);
}

// Send a message to user by his id
function send(uid, msg) {
  var url = `https://api.vk.com/method/messages.send?user_id=${uid}&message=${encodeURIComponent(msg)}&access_token=${vkApiKey}`;
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) console.log("[<] Message sent to user: ", uid);
    if (error) console.log('[!] Error occured when sending a message: ', error);
  })
}

function badParams(functionName) {
  console.log('[!] Bad parameters for function ' + functionName + '().');
  console.log('[!] Terminating.');
  process.exit(1);
}

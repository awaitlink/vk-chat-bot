const app = require('express')();
const bodyParser = require('body-parser');

const behavior = require('./behavior.js');
const Log = require('./log.js');
log = new Log();

exports.cmd   = function (command, a, b)   { behavior.cmd   (command, a, b);   };
exports.regex = function (regex, callback) { behavior.regex (regex, callback); };
exports.on    = function (e, callback)     { behavior.on    (e, callback);     };

exports.help = function () { return behavior.help(); };

var groupId, confirmationToken, secret, vkApiKey;

var initialized = false;

// Initialise the bot
exports.init = function (params) {
  if (!params) {
    log.badParams("init");
  }

  groupId = params.group_id;
  confirmationToken = params.confirmation_token;
  secret = params.secret;
  vkApiKey = params.vk_api_key;

  behavior.setCmdPrefix(params.cmd_prefix);

  if (groupId && confirmationToken && secret && vkApiKey) {
    initialized = true;
  } else {
    log.badParams("init");
  }
};

// Start the bot
exports.start = function (port) {
  if (!port) {
    log.badParams("start");
  }

  if (!initialized) {
    log.log(log.type.error, 'Please initialize the bot before starting it using init(params).');
    log.terminate();
  }

  behavior.setKey(vkApiKey);

  app.use(bodyParser.json());

  app.get('/', (req, res) => {
    res.status(400).send('Only POST allowed.');
    log.log(log.type.request, 'GET request.');
  });

  app.post('/', (req, res) => {
    body = req.body;

    if (body.type === "confirmation" && body.group_id == groupId) {
        res.status(200).send(confirmationToken);
    } else if (body.secret === secret) {
        res.status(200).send('ok');
        behavior.parseRequest(body);
    } else {
        res.status(400).send('Invalid secret key.');
        log.log(log.type.request, 'Request with an invalid secret key.');
    }
  });

  var server = app.listen(port, (err) => {
    if (err){
      log.log(log.type.error, 'Error: ' + err);
      log.terminate();
    }
    log.log(log.type.information, `Server is listening on port ${port}.`);

    // Quit in test mode
    if (vkApiKey == "test"){
      log.log(log.type.information, `Stopping the server because in test mode.`);
      server.close();
    }
  });
};

# VK Chat Bot [![npm version](https://img.shields.io/npm/v/vk-chat-bot.svg)](https://www.npmjs.com/package/vk-chat-bot)  	[![Downloads](https://img.shields.io/npm/dt/vk-chat-bot.svg)](https://www.npmjs.com/package/vk-chat-bot) [![Dependency Status](https://david-dm.org/sudoio/vk-chat-bot.svg)](https://david-dm.org/sudoio/vk-chat-bot) [![MIT License](https://img.shields.io/github/license/sudoio/vk-chat-bot.svg)](https://github.com/sudoio/fast-electron/blob/master/LICENSE.md)
This is a chat bot library for [VK](https://vk.com) social network communities.    
It uses VK's [Callback API](https://vk.com/dev/callback_api) to get new messages from users.

## Installation
```bash
npm install vk-chat-bot
```
## Example
You can find the example in the [`sudoio/vk-chat-bot-example`](https://github.com/sudoio/vk-chat-bot-example) repository.

Also, you can take a look at the **step-by-step** [Heroku Chat Bot](https://github.com/sudoio/vk-chat-bot/wiki/Heroku-Deploy-Guide) creation guide.

## Usage
#### 1. Preparation
First, `require()` the `vk-chat-bot`:
```js
const bot = require("vk-chat-bot");
```

Then, initialize your bot with `bot.init(params)`:
```js
var params = {
  vk_api_key: process.env.VK_API_KEY,

  // Confirmation parameters, can be found in group Callback API settings
  confirmation_token: process.env.CONFIRMATION_TOKEN,
  group_id: process.env.GROUP_ID,

  // Secret key, set it in group Callback API settings
  secret: process.env.SECRET,

  // Any command prefix, optional
  cmd_prefix: "/"
}

bot.init(params);
```

#### 2. Defining behavior

See [Behavior definition functions](https://github.com/sudoio/vk-chat-bot/wiki/Behavior-definition-functions) wiki for more information.

Here's an example:
```js
// When user allowed to send messages to him
bot.on("message_allow", (obj) => {
  return "Hello, thanks for allowing us to send you messages.";
});

// If no matching handler is found
bot.on("no_match", (obj) => {
  return "I don't know how to respond to your message.";
});

// When the first word in the message is cmd_prefix + "test"
// For example, if cmd_prefix is "/", we search for "/test"
bot.cmd("test", "sure thing tests something", (msg, obj) => {
  return "Test success! Your message content was: '" + msg + "'.";
});

// For example, if cmd_prefix is "/", we search for "/help"
bot.cmd("help", "shows the help message", (msg, obj) => {
  // bot.help() returns the help message
  return "Test Bot v1.0" + bot.help();
});

// When the message contains a word "hi", "hello" or "hey"
bot.regex("(hi|hello|hey)", (msg, obj) => {
  return "Hello, I am a test bot. You said: " + msg;
});
```

#### 3. Start it!
Start the bot providing a port it will be run at.

```js
// Server port
const port = process.env.PORT;

bot.start(port);
```

The bot will log some useful information, see [Logging](https://github.com/sudoio/vk-chat-bot/wiki/Logging) wiki for more information.

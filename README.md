# VK Chat Bot
[![npm version](https://img.shields.io/npm/v/vk-chat-bot.svg?style=flat-square)](https://www.npmjs.com/package/vk-chat-bot)  	[![Downloads](https://img.shields.io/npm/dt/vk-chat-bot.svg?style=flat-square)](https://www.npmjs.com/package/vk-chat-bot) [![Dependency Status](https://david-dm.org/sudoio/vk-chat-bot.svg?style=flat-square)](https://david-dm.org/sudoio/vk-chat-bot) [![MIT License](https://img.shields.io/github/license/sudoio/vk-chat-bot.svg?style=flat-square)](https://github.com/sudoio/vk-chat-bot/blob/master/LICENSE.md)

> This is a chat bot library for [VK](https://vk.com) social network communities.    
> It uses VK's [Callback API](https://vk.com/dev/callback_api) to get new messages from users.

Branch | Status
---|---
`master` | [![Travis build status](https://img.shields.io/travis/sudoio/vk-chat-bot/master.svg?style=flat-square)](#)

## Installation
```bash
npm i vk-chat-bot
```
## Example
You can find the example in the [`sudoio/vk-chat-bot-example`](https://github.com/sudoio/vk-chat-bot-example) repository.

Also, you can take a look at the **step-by-step** [Heroku Chat Bot](https://github.com/sudoio/vk-chat-bot/wiki/Heroku-Deploy-Guide) creation guide.

## Usage
#### 1. Preparation
First, `require()` the `ChatBot` class from `vk-chat-bot`:
```js
const ChatBot = require("vk-chat-bot");
```

Then, initialize your bot:
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

bot = new ChatBot(params);
```

#### 2. Defining behavior

See [Behavior definition functions](https://github.com/sudoio/vk-chat-bot/wiki/Behavior-definition-functions) wiki for more information.

Here's an example:
```js
// When user allowed to send messages to him
bot.on("message_allow", ($) => {
  $.text("Hello, thanks for allowing us to send you messages.");
});

// If no matching handler is found
bot.on("no_match", ($) => {
  $.text("I don't know how to respond to your message.");
});

// Example: if cmd_prefix is "/", we search for "/test"
bot.cmd("test", "sure thing tests something", ($) => {
  $.text("Test success! Your message content was: '" + $.msg + "'.");
});

// Example: if cmd_prefix is "/", we search for "/help"
bot.cmd("help", "shows the help message", ($) => {
  // bot.help() returns the help message
  $.text("Test Bot v1.0" + bot.help());
});

// When the message contains a word "hi", "hello" or "hey"
bot.regex(/(hi|hello|hey)/gi, ($) => {
  $.text("Hello, I am a test bot. You said: " + $.msg);
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

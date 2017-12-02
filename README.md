# VK Chat Bot [![npm version](https://img.shields.io/npm/v/vk-chat-bot.svg)](https://www.npmjs.com/package/vk-chat-bot)  	[![Downloads](https://img.shields.io/npm/dt/vk-chat-bot.svg)](https://www.npmjs.com/package/vk-chat-bot) [![Dependency Status](https://david-dm.org/sudoio/vk-chat-bot.svg)](https://david-dm.org/sudoio/vk-chat-bot) [![MIT License](https://img.shields.io/github/license/sudoio/vk-chat-bot.svg)](https://github.com/sudoio/fast-electron/blob/master/LICENSE.md)
This is a chat bot for [VK](https://vk.com) social network communities.    
This bot uses VK's [Callback API](https://vk.com/dev/callback_api) to get new messages from users.

## Installation
```bash
npm install vk-chat-bot
```

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

  // Command prefix, optional
  cmd_prefix: process.env.CMD_PREFIX
}

bot.init(params);
```

#### 2. Defining behavior
There are three functions available to define behavior: `on()`, `onlike()` and `event()`.

1. If `message_allow` or `message_deny` event occurs, matching `event()` handler will be called and `user_id` will be passed.
1. If `message_new` event occurs, the following happens:
  - If there is a matching command defined, matching `on()` is called (the **message** will be passed to it).
  - If no commands match, a matching regex will be searched for and matching `onlike()` called (the **message** will be passed to it).

If you want to send a response, `return` a string containing it.

Here's an example:
```js
bot.event("message_allow", (uid) => {
  return "Hello, thanks for allowing us to send you messages.";
});

bot.on("test", (msg) => {
  return "Test success! Your message content (excluding command) was: \"" + msg + "\".";
});

bot.onlike("(hi|hello|hey)", (msg) => {
  return "Hello, I am a test bot.";
});
```

#### 3. Start it!
Start the bot providing a port it will be run at.

```js
// Server port
const port = process.env.PORT;

bot.start(port);
```

## Example
You can find the example in [`example/main.js`](https://github.com/sudoio/vk-chat-bot/blob/master/example/main.js).

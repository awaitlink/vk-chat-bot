# VK Chat Bot [![npm version](https://img.shields.io/npm/v/vk-chat-bot.svg)](https://www.npmjs.com/package/vk-chat-bot)  	[![Downloads](https://img.shields.io/npm/dt/vk-chat-bot.svg)](https://www.npmjs.com/package/vk-chat-bot) [![Dependency Status](https://david-dm.org/sudoio/vk-chat-bot.svg)](https://david-dm.org/sudoio/vk-chat-bot) [![MIT License](https://img.shields.io/github/license/sudoio/vk-chat-bot.svg)](https://github.com/sudoio/fast-electron/blob/master/LICENSE.md)
This is a chat bot for [VK](https://vk.com) social network communities.    
This bot uses VK's [Callback API](https://vk.com/dev/callback_api) to get new messages from users.

## Installation
```bash
npm install vk-chat-bot
```
## Example
You can find the example in [`example/main.js`](https://github.com/sudoio/vk-chat-bot/blob/master/example/main.js).    

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

See [Behavior-defining functions](#behavior-defining-functions) section for more information.

Here's an example:
```js
// When user allowed to send messages to him
bot.on("message_allow", (uid) => {
  return "Hello, thanks for allowing us to send you messages.";
});

// If no matching handler is found
bot.on("no_match", (uid) => {
  return "I don't know how to respond to your message.";
});

// When the first word in the message is cmd_prefix + "test"
// For example, if cmd_prefix is "/", we search for "/test"
bot.cmd("test", (msg) => {
  return "Test success! Your message content (excluding command) was: \"" + msg + "\".";
});

// When the message contains a word "hi", "hello" or "hey"
bot.regex("(hi|hello|hey)", (msg) => {
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

The bot will log some useful information, see [Logging](#logging) section for more information.

## Behavior-defining functions
> Only one handler will be called for a message.    
> Handlers will be searched in this order: `on()`, `cmd()`, `regex()`.

Method | Description | Passed to handler | Returned value by handler
--- | --- | --- | ---
`on(event, handler)` | Handles various special events (see [Special events](#special-events)) | `uid` - user id | Depends on event type
`cmd(command, handler)` | Handler is called only if the **first word** in the message is `cmd_prefix` **+** `command` | `msg` - user message, excluding the `cmd_prefix` and `command` |  **Sent** to the user
`regex(regex, handler)` | Handler is called if the message matches the `regex` | `msg` - full user message | **Sent** to the user

## Special events

Event type | When handler is called | Returned value by handler
--- | --- | ---
`"message_allow"` | When we receive `"message_allow"` from Callback API (User allowed sending messages to him/her) | **Sent** to the user
`"message_deny"` | When we receive `"message_deny"` from Callback API (User disallowed sending messages to him/her) | **Ignored**
`"no_match"` | When no matching `cmd()` or `regex()` handler is found | **Sent** to the user

## Logging
Log message beginning | Meaning | Description
--- | --- | ---
`[i]` | Information | Just some information for you
`[>]` | Request | A request to the bot was made
`[<]` | Response | The bot sent a response to the user
`[!]` | Error | An error happened. If it happened during initialization or starting, the bot will exit with status code **1**

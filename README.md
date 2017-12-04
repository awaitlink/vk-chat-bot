# VK Chat Bot [![npm version](https://img.shields.io/npm/v/vk-chat-bot.svg)](https://www.npmjs.com/package/vk-chat-bot)  	[![Downloads](https://img.shields.io/npm/dt/vk-chat-bot.svg)](https://www.npmjs.com/package/vk-chat-bot) [![Dependency Status](https://david-dm.org/sudoio/vk-chat-bot.svg)](https://david-dm.org/sudoio/vk-chat-bot) [![MIT License](https://img.shields.io/github/license/sudoio/vk-chat-bot.svg)](https://github.com/sudoio/fast-electron/blob/master/LICENSE.md)
This is a chat bot library for [VK](https://vk.com) social network communities.    
It uses VK's [Callback API](https://vk.com/dev/callback_api) to get new messages from users.

## Installation
```bash
npm install vk-chat-bot
```
## Example
You can find the example in the [`sudoio/vk-chat-bot-example`](https://github.com/sudoio/vk-chat-bot-example) repository.

Also, you can take a look at the **step-by-step** [Heroku Chat Bot](https://github.com/sudoio/vk-chat-bot/blob/master/heroku_guide) creation guide.

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

See [Behavior-defining functions](#behavior-defining-functions) section for more information.

Here's an example:
```js
// When user allowed to send messages to him
bot.on("message_allow", (obj) => {
  return "Hello, thanks for allowing us to send you messages.";
});

// If no matching handler is found
bot.on("no_match", (obj) => {
  return "I don't know how to respond to your message sent at " + obj.date + " (Unixtime).";
});

// When the first word in the message is cmd_prefix + "test"
// For example, if cmd_prefix is "/", we search for "/test"
bot.cmd("test", (msg, obj) => {
  return "Test success! Your message content (excluding command) was: '" + msg + "'.";
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

The bot will log some useful information, see [Logging](#logging) section for more information.

## Behavior-defining functions
> Only one handler will be called for a message.    
> Handlers will be searched in this order: `on()`, `cmd()`, `regex()`.

Method | Description | Passed to handler | Returned value by handler
--- | --- | --- | ---
`on(event, handler)` | Handles various special events (see [Special events](#special-events)) | **Depends** on event type | **Depends** on event type
`cmd(command, handler)` | Handler is called only if the **first word** in the message is `cmd_prefix` **+** `command` | `msg` (user message, excluding the `cmd_prefix` and `command`), `obj` ([Private message object](https://vk.com/dev/objects/message)) |  **Sent** to the user
`regex(regex, handler)` | Handler is called if the message matches the `regex` | `msg` (full user message), `obj` ([Private message object](https://vk.com/dev/objects/message)) | **Sent** to the user

## Special events

Event type | When handler is called | Passed to handler | Returned value by handler
--- | --- | --- | ---
`"message_allow"` | When we receive `"message_allow"` from Callback API (User **allowed** sending messages to him/her) | `obj` (object passed by Callback API ([learn more](https://vk.com/dev/callback_api))) | **Sent** to the user
`"message_deny"` | When we receive `"message_deny"` from Callback API (User **disallowed** sending messages to him/her) | `obj` (object passed by Callback API ([learn more](https://vk.com/dev/callback_api))) | **Ignored**
`"message_reply"` | When we receive `"message_reply"` from Callback API (New **message sent** by community (or by the bot itself)) | `obj` ([Private message object](https://vk.com/dev/objects/message)) | **Sent** to the user
`"no_match"` | When no matching `cmd()` or `regex()` handler is found | `obj` ([Private message object](https://vk.com/dev/objects/message)) | **Sent** to the user

## Logging
Log message beginning | Meaning | Description
--- | --- | ---
`[i]` | Information | Just some information for you
`[>]` | Request | A request to the bot was made
`[<]` | Response | The bot sent a response to the user
`[!]` | Error | An error happened. If it happened during initialization or starting, the bot will exit with status code **1**

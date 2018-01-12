# VK Chat Bot
[![npm version](https://img.shields.io/npm/v/vk-chat-bot.svg?style=flat-square)](https://www.npmjs.com/package/vk-chat-bot)
[![Downloads](https://img.shields.io/npm/dt/vk-chat-bot.svg?style=flat-square)](https://www.npmjs.com/package/vk-chat-bot)
[![Dependency Status](https://david-dm.org/sudoio/vk-chat-bot.svg?style=flat-square)](https://david-dm.org/sudoio/vk-chat-bot)
[![Travis build status](https://img.shields.io/travis/sudoio/vk-chat-bot/master.svg?style=flat-square)](https://travis-ci.org/sudoio/vk-chat-bot)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square)](https://standardjs.com)    
<sub>GitHub [Releases](https://github.com/sudoio/vk-chat-bot/releases) contain only **major** and **minor** versions.</sub>

> This is a chat bot library for [VK](https://vk.com) social network communities.    
> See the [wiki](https://github.com/sudoio/vk-chat-bot/wiki) for description of all features.

## Features
- **Easy to use** - setting up behavior is simple - see [Behavior setup](#2-behavior-setup)
- **Stable** - the library calls VK API not more then 20 times/second, so you don't exceed the quota

## Usage
#### Installation
```bash
npm i vk-chat-bot
```

#### Example
You can find the example in the [`sudoio/vk-chat-bot-example`](https://github.com/sudoio/vk-chat-bot-example) repository.    
Also, you can take a look at the **step-by-step** [Heroku Chat Bot](https://github.com/sudoio/vk-chat-bot/wiki/Heroku-Deploy-Guide) creation guide.

#### Quick Start
###### 1. Preparation
First, `require()` the `ChatBot` class from `vk-chat-bot`:
```js
const ChatBot = require('vk-chat-bot')
```

Then, initialize your bot (see [Params object](https://github.com/sudoio/vk-chat-bot/wiki/Chat-Bot#params-object) for more information about `params`):
```js
var params = {
  vk_api_key: 'your_vk_api_key_here',
  confirmation_token: 'f123321',
  group_id: 1234567,
  secret: 's3r10us1y_s3cr3t_phr4s3',

  cmd_prefix: "/"
}

var bot = new ChatBot(params)
```

###### 2. Behavior setup

See [Setting behavior](https://github.com/sudoio/vk-chat-bot/wiki/Chat-Bot#setting-behavior) wiki to learn how you can set up behavior with these functions.   
Here's an example:
```js
// When user allowed to send messages to him
bot.on('message_allow', ($) => {
  $.text('Hello, thanks for allowing us to send you messages.')
})
```
```js
// If no matching handler is found
bot.on('no_match', ($) => {
  $.text("I don't know how to respond to your message.")
})
```
```js
// Example: if cmd_prefix is "/", we search for "/help"
bot.cmd('help', 'shows the help message', ($) => {
  // bot.help() returns the help message
  $.text('Test Bot v1.0' + bot.help())

  // Attach a nice image from https://vk.com/team?z=photo6492_456240778
  $.attach('photo', 6492, 456240778)
})
```
```js
// When the message contains a word "hi", "hello" or "hey"
// Ignoring case with /i
bot.regex(/h(i|ello|ey)/i, ($) => {
  $.text('Hello, I am a test bot. You said: ' + $.msg)
})
```

###### 3. Start it!
Start the bot providing a port it will run at.

```js
// Server port
var port = process.env.PORT

bot.start(port)
```

The bot will log some useful information, see [Logging](https://github.com/sudoio/vk-chat-bot/wiki/Logging) wiki for more information.

# VK Chat Bot
[![npm version](https://img.shields.io/npm/v/vk-chat-bot.svg?style=flat-square)](https://www.npmjs.com/package/vk-chat-bot)
[![Downloads](https://img.shields.io/npm/dt/vk-chat-bot.svg?style=flat-square)](https://www.npmjs.com/package/vk-chat-bot)
[![Travis build status](https://img.shields.io/travis/u32i64/vk-chat-bot/master.svg?style=flat-square&logo=travis)](https://travis-ci.org/u32i64/vk-chat-bot)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square)](https://standardjs.com)    

> This is a **chat bot library** for **VK** *communities* (*groups*).    
> See the [wiki](https://github.com/u32i64/vk-chat-bot/wiki) for description of all features.    
> Changelog is available [here](https://github.com/u32i64/vk-chat-bot/blob/master/CHANGELOG.md).

## Features
- **Easy to use** - setting up behavior is simple - see [Behavior setup](#2-behavior-setup)
- **Respects the quota** - the library calls VK API not more then 20 times/second, so you don't exceed the quota

## Usage
#### Installation
```bash
npm i vk-chat-bot
```

#### Example
You can find the example in the [`vk-chat-bot-example`](https://github.com/u32i64/vk-chat-bot-example) repository.    
Also, you can take a look at the **step-by-step [Heroku Deploy Guide](https://github.com/u32i64/vk-chat-bot/wiki/Heroku-Deploy-Guide)**.

#### Quick Start
###### 1. Preparation
First, `require()` the library:
```js
const vk = require('vk-chat-bot')
```

Then, create your bot using the `vk.bot` function (see [Params object](https://github.com/u32i64/vk-chat-bot/wiki/Main#params-object) for more information about `params`):
```js
var params = {
  vk_token: 'your_vk_access_token',
  confirmation_token: 'f123456',
  group_id: 1234567,
  secret: 's3r10us1y_s3cr3t_phr4s3',
  port: 12345,

  cmd_prefix: "/"
}

var {bot, core} = vk.bot(params)
```

###### 2. Behavior setup

See [`Core`](https://github.com/u32i64/vk-chat-bot/wiki/Core) wiki to learn more about behavior functions.   
Here are some examples:
```js
// No matching handler is found
core.on('no_match', $ => {
  $.text("I don't know how to respond to your message.")
})
```
```js
core.cmd('keyboard', $ => {
  var Keyboard = $.kbd.Keyboard
  var Button = $.kbd.Button
  var colors = $.kbd.colors

  // Set 'true' instead of 'false' to make it disapper after a button was pressed
  var kbd = new Keyboard([
    // Rows
    [
      new Button('Default'),
      new Button('Primary', colors.primary),
      new Button('Negative', colors.negative),
      new Button('Positive', colors.positive)
    ],
    [
      new Button('Maximum rows is 10, columns - 4.')
    ],
  ], false)

  $.text('Here is your keyboard, as promised.')
  $.keyboard(kbd)
})
```
```js
// Searches for cmd_prefix + 'help', e.g. "/help"
core.cmd('help', $ => {
  // bot.help() returns the help message
  $.text('Test Bot v1.0' + core.help())

  // Attach an image from
  // https://vk.com/team?z=photo6492_45624077
  $.attach('photo', 6492, 456240778)
}, 'shows the help message')
```
```js
// Use case-insensitive regex to find words "hi", "hello" or "hey"
core.regex(/h(i|ello|ey)/i, $ => {
  $.text('Hello, I am a test bot. You said: ' + $.msg)
})
```

###### 3. Start it!
Start the bot:

```js
bot.start()
```

The bot will log some useful information, see [Logging](https://github.com/u32i64/vk-chat-bot/wiki/Logging) wiki for more information.

## Contributing
- Having issues?    
  Found a bug?    
  Something does not seem right?    
  Or you have a feature request?    
  **Open an [issue](https://github.com/u32i64/vk-chat-bot/issues).**

- You know how to make `vk-chat-bot` better?
  - Fork the repository.
  - Clone the fork to your computer:
    ```bash
    git clone git@github.com:username/vk-chat-bot
    ```
  - Make your changes.
  - Stage files, commit them, and push the commit to your fork:
    ```bash
    git add *
    git commit -m "Small description of what you changed"
    git push -u origin master
    ```
  - **Open a [pull request](https://github.com/u32i64/vk-chat-bot/pulls)!**

## License
This project is licensed under the terms of the **[MIT](https://github.com/u32i64/vk-chat-bot/blob/master/LICENSE)** license.

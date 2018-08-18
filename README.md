# VK Chat Bot
[![npm version][badges/npm]][npm]
[![downloads][badges/downloads]][npm]
[![Travis build status][badges/travis]][travis]
[![code style][badges/standard]][standard]  

> This is a **chat bot library** for **VK** *communities* (*groups*).    
> See the [wiki] for description of all features.    
> Changelog is available [here][changelog].

## Features
- **Easy to use** - setting up behavior is simple - see [Behavior setup](#2-behavior-setup)
- **Respects the quota** - the library calls VK API not more then 20 times/second, so you don't exceed the quota

## Usage
#### Installation
```console
$ npm i vk-chat-bot
```

#### Example
You can find the example in the [`vk-chat-bot-example`][example] repository.    
Also, you can take a look at the **step-by-step [Heroku Deploy Guide][wiki/Heroku-Deploy-Guide]**.

#### Quick Start
###### 1. Preparation
First, `require()` the library:
```js
const vk = require('vk-chat-bot')
```

Then, create your bot using the `vk.bot` function (see [Params object][wiki/Main#params-object] for more information about `params`):
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

See [`Core`][wiki/Core] wiki to learn more about behavior functions.   
Here are some examples:
```js
// No matching handler is found
core.on('no_match', $ => {
  $.text("I don't know how to respond to your message.")
})
```
```js
var Keyboard = vk.kbd.Keyboard
var Button = vk.kbd.Button
var colors = vk.kbd.colors

core.cmd('keyboard', $ => {
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

The bot will log some useful information, see [Logging][wiki/Logging] wiki for more information.

## Contributing
- Something does not seem right or you have a feature request? **Open an [issue][issues].**
- You know how to make `vk-chat-bot` better? **Open a [pull request][pulls]!**

## License
This project is licensed under the terms of the **[MIT](https://github.com/u32i64/vk-chat-bot/blob/master/LICENSE)** license.

<!-- LINKS -->

[badges/standard]:  https://img.shields.io/badge/code_style-standard-6200ea.svg?style=for-the-badge
[badges/travis]:    https://img.shields.io/travis/u32i64/vk-chat-bot/master.svg?style=for-the-badge&logo=travis
[badges/npm]:       https://img.shields.io/npm/v/vk-chat-bot.svg?style=for-the-badge
[badges/downloads]: https://img.shields.io/npm/dt/vk-chat-bot.svg?style=for-the-badge

[npm]:    https://www.npmjs.com/package/vk-chat-bot
[travis]: https://travis-ci.org/u32i64/vk-chat-bot

[changelog]: https://github.com/u32i64/vk-chat-bot/blob/master/CHANGELOG.md
[license]:   https://github.com/u32i64/vk-chat-bot/blob/master/LICENSE

[wiki]:                     https://github.com/u32i64/vk-chat-bot/wiki
[wiki/Core]:                https://github.com/u32i64/vk-chat-bot/wiki/Core
[wiki/Logging]:             https://github.com/u32i64/vk-chat-bot/wiki/Logging
[wiki/Heroku-Deploy-Guide]: https://github.com/u32i64/vk-chat-bot/wiki/Heroku-Deploy-Guide
[wiki/Main#params-object]:  https://github.com/u32i64/vk-chat-bot/wiki/Main#params-object

[example]: https://github.com/u32i64/vk-chat-bot-example
[issues]:  https://github.com/u32i64/vk-chat-bot/issues
[pulls]:   https://github.com/u32i64/vk-chat-bot/pulls

[standard]: https://standardjs.com

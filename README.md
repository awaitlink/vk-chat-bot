# ❮vk-chat-bot❯
[![version][badges/npm]][npm]
[![downloads][badges/downloads]][npm]
[![style][badges/airbnb]][airbnb]
[![travis][badges/travis]][travis]

> **A chat bot framework for VK communities (*groups*).**    
> **[documentation »][docs]** ⋅
> **[changelog »][changelog]** ⋅
> [features](#features) ⋅
> [usage](#usage) ⋅
> [contributing](#contributing) ⋅
> [license](#license)

## Features
- **Easy to use** - setting up behavior is simple - see [2. Behavior setup](#2-behavior-setup) below
- **Respects the quota** - the framework calls VK API not more then 20 times/second, so you don't exceed the quota

## Usage
#### Installation
|          yarn          |         npm         |
|:----------------------:|:-------------------:|
| `yarn add vk-chat-bot` | `npm i vk-chat-bot` |


#### Example
You can find an example bot in the [`u32i64/vk-chat-bot-example`][example] repository.    
Also, a **step-by-step [Heroku Deploy Guide][docs/Heroku-Deploy-Guide]** can guide you through the process of deploying [`u32i64/vk-chat-bot-example`][example] to Heroku.

#### Quick Start
###### 1. Preparation
First, `require()` the framework:
```js
const vk = require('vk-chat-bot')
```

Then, create your bot using the `vk.bot` function (see [Params object][docs/bot] for more information about `params`):
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

See [`Core`][docs/Core] wiki to learn more about behavior functions.   
Here are some examples:
```js
// Use stuff from the framework...
var Keyboard = vk.kbd.Keyboard
var Button = vk.kbd.Button
var colors = vk.kbd.colors

// ...to create a keyboard like this.
// +---------+---------+----------+----------+
// | Default | Primary | Negative | Positive |
// +---------+---------+----------+----------+
// |     Maximum rows is 10, columns - 4.    |
// +-----------------------------------------+
var kbd = new Keyboard([
  [ /* Row (array of buttons) */
    new Button('Default'),
    new Button('Primary', colors.primary),
    new Button('Negative', colors.negative),
    new Button('Positive', colors.positive)
  ],
  [
    new Button('Maximum rows is 10, columns - 4.')
  ],
])

// When user presses the `Start` button...
// (you have to enable the button in community settings)
core.on('start', $ => {
  // ...send them our keyboard.
  $.text("Thanks for messaging us! Choose from the options below:")
  $.keyboard(kbd)

  // Here, $.send() is added automatically.
})
```
```js
// Searches for cmd_prefix + 'help', e.g. "/help"
core.cmd('help', $ => {
  // core.help() returns the help message
  $.text('Test Bot v1.0' + core.help())

  // Attach an image from
  // https://vk.com/team?z=photo6492_45624077
  $.attach('photo', 6492, 456240778)
}, 'shows the help message')
```
```js
// Use case-insensitive regular expression to find words "hi", "hello" or "hey"
core.regex(/h(i|ello|ey)/i, $ => {
  $.text('Hello, I am a test bot. You said: ' + $.msg)
})
```

###### 3. Start it!
Start the bot:

```js
bot.start()
```

The bot will log some useful information, see [Logging][docs/Stats] documentation for more information.

## Contributing
- Something does not seem right or you have a feature request? **Open an [issue][issues].**
- You know how to make `vk-chat-bot` better? **Open a [pull request][pulls]!**

## License
This project is licensed under the terms of the **[MIT][license]** license.

<!-- LINKS -->

[badges/airbnb]:  https://img.shields.io/badge/code_style-airbnb-fa5a5f.svg?style=for-the-badge
[badges/travis]:    https://img.shields.io/travis/u32i64/vk-chat-bot/master.svg?style=for-the-badge&logo=travis
[badges/npm]:       https://img.shields.io/npm/v/vk-chat-bot.svg?style=for-the-badge&logo=npm
[badges/downloads]: https://img.shields.io/npm/dt/vk-chat-bot.svg?style=for-the-badge

[npm]:    https://www.npmjs.com/package/vk-chat-bot
[travis]: https://travis-ci.org/u32i64/vk-chat-bot

[changelog]: https://github.com/u32i64/vk-chat-bot/blob/master/CHANGELOG.md
[license]:   https://github.com/u32i64/vk-chat-bot/blob/master/LICENSE

[docs]:                     https://u32i64.github.io/vk-chat-bot/
[docs/Core]:                https://u32i64.github.io/vk-chat-bot/Core.html
[docs/Stats]:               https://u32i64.github.io/vk-chat-bot/Stats.html
[docs/Heroku-Deploy-Guide]: https://u32i64.github.io/vk-chat-bot/tutorial-heroku-deploy-guide.html
[docs/bot]:                 https://u32i64.github.io/vk-chat-bot/global.html#bot

[example]: https://github.com/u32i64/vk-chat-bot-example
[issues]:  https://github.com/u32i64/vk-chat-bot/issues
[pulls]:   https://github.com/u32i64/vk-chat-bot/pulls

[airbnb]: https://github.com/airbnb/javascript

# ❮vk-chat-bot❯
[![version][badges/npm]][npm]
[![downloads][badges/downloads]][npm]
[![bundle size][badges/size]][bundlephobia]

> Package for easy creation of chat bots for VK communities (*groups*). Uses Callback API.
> **[documentation »][docs]** ⋅
> **[changelog »][changelog]** ⋅
> [features](#features) ⋅
> [usage](#usage) ⋅
> [contributing](#contributing) ⋅
> [license](#license)

## Features
- **Easy to use** — setting up behavior is simple — see [2. Behavior setup](#2-behavior-setup) below
- **Respects the quota** — the package calls VK API not more then 20 times/second, so you don't exceed the quota

The version of VK API used by this package can be found [here][api-version].

## Usage
### Installation
```console
$ yarn add vk-chat-bot
```

### Example
You can find an example bot in the [`u32i64/vk-chat-bot-example`][example] repository.

- **Deploying on [Glitch](https://glitch.com/)**

  Simply press the button below and follow the `SETUP.md` file there:

  <a href="https://glitch.com/edit/#!/remix/vk-chat-bot-example"><img src="https://cdn.glitch.com/2bdfb3f8-05ef-4035-a06e-2043962a3a13%2Fremix%402x.png?1513093958726" alt="remix this" height="33"></a>

- **Deploying on [Heroku](https://heroku.com)**

  You can find a step-by-step guide on deploying the example to Heroku [here](https://github.com/u32i64/vk-chat-bot/blob/master/tutorials/heroku-deploy-guide.md).

### Quick Start
#### 1. Preparation
First, `require()` the package:
```js
const vk = require('vk-chat-bot');
```

Then, create your bot using the `vk.bot` function (see [Params object][docs/bot] for more information about `params`):
```js
const params = {
  vkToken: 'your_vk_access_token',
  confirmationToken: 'f123456',
  groupId: 1234567,
  secret: 's3r10us1y_s3cr3t_phr4s3',
  port: 12345,

  cmdPrefix: '/'
};

var { bot, core } = vk.bot(params);
```

#### 2. Behavior setup

See [`Core`][docs/Core] wiki to learn more about behavior functions.
Here are some examples:
```js
// Use stuff from the package...
const { Color, button, Keyboard } = vk.kbd;

// ...to create a keyboard like this.
// +-----------+---------+----------+----------+
// | Secondary | Primary | Negative | Positive |
// +-----------+---------+----------+----------+
// |      Maximum rows is 10, columns - 4.     |
// +-------------------------------------------+
var kbd = new Keyboard([
  [ /* Row (array of buttons) */
    button.text('Secondary'),
    button.text('Primary', Color.Primary),
    button.text('Negative', Color.Negative),
    button.text('Positive', Color.Positive)
  ],
  [
    button.text('Maximum rows is 10, columns - 4.')
  ],
]);

// When user presses the `Start` button...
// (you have to enable the button in community settings)
core.on('start', $ => {
  // ...send them our keyboard.
  $.text('Thanks for messaging us! Choose from the options below:');
  $.keyboard(kbd);

  // Here, $.send() is added automatically.
});
```
```js
// Searches for cmd_prefix + 'help', e.g. '/help'
core.cmd('help', $ => {
  // core.help() returns the help message
  $.text('Test Bot v1.0' + core.help());

  // Attach an image from
  // https://vk.com/team?z=photo6492_45624077
  $.attach('photo', 6492, 456240778);
}, 'shows the help message');
```
```js
// Use case-insensitive regular expression to find words 'hi', 'hello' or 'hey'
core.regex(/h(i|ello|ey)/i, $ => {
  $.text('Hello, I am a test bot. You said: ' + $.msg);
});
```

#### 3. Start it!
Start the bot:

```js
bot.start();
```

The bot will log some useful information, see [Logging][docs/Stats] documentation for more information.

## Contributing
- Something does not seem right or you have a feature request? **Open an [issue][issues].**
- You know how to make `vk-chat-bot` better? **Open a [pull request][pulls]!**

## License
This project is licensed under the terms of the **[MIT][license]** license.

<!-- LINKS -->

[badges/npm]:       https://img.shields.io/npm/v/vk-chat-bot.svg?style=for-the-badge&logo=npm
[badges/downloads]: https://img.shields.io/npm/dt/vk-chat-bot.svg?style=for-the-badge
[badges/size]: https://img.shields.io/bundlephobia/minzip/vk-chat-bot?style=for-the-badge

[bundlephobia]: https://bundlephobia.com/result?p=vk-chat-bot

[api-version]: https://github.com/u32i64/vk-chat-bot/blob/master/src/api/api.ts#L9

[npm]:    https://www.npmjs.com/package/vk-chat-bot

[changelog]: https://github.com/u32i64/vk-chat-bot/blob/master/CHANGELOG.md
[license]:   https://github.com/u32i64/vk-chat-bot/blob/master/LICENSE

[docs]:                     https://u32i64.github.io/vk-chat-bot/
[docs/Core]:                https://u32i64.github.io/vk-chat-bot/classes/_core_.core.html
[docs/Stats]:               https://u32i64.github.io/vk-chat-bot/classes/_extra_stats_.stats.html
[docs/Heroku-Deploy-Guide]: https://github.com/u32i64/vk-chat-bot/blob/master/tutorials/heroku-deploy-guide.md
[docs/bot]:                 https://u32i64.github.io/vk-chat-bot/modules/_main_.html#bot

[example]: https://github.com/u32i64/vk-chat-bot-example
[issues]:  https://github.com/u32i64/vk-chat-bot/issues
[pulls]:   https://github.com/u32i64/vk-chat-bot/pulls

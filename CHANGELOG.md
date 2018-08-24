# Changelog
All notable changes to this project will be documented in this file.    
The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

**Note:** Patch versions prior to [v8.0.0](#800---2018-07-01) are not listed here.

## [10.4.0] - 2018-08-24
### Added
- Now [`payload`](https://github.com/u32i64/vk-chat-bot/wiki/Core#payload) handlers can handle not only exactly matching payloads, but also provide a function which, given a payload, will determine whether this handler is the one that needs to handle a specific payload. See the [wiki](https://github.com/u32i64/vk-chat-bot/wiki/Core#payload) for details.

### Fixed
- Added the payload handlers count to initialization log message

## [10.3.0] - 2018-08-23
### Added
- Payload handlers: see [`payload`](https://github.com/u32i64/vk-chat-bot/wiki/Core#payload) wiki.

### Changed
- Now statistics will show uptime in the format `??y ??d ??h ??m ??s`

### Fixed
- Since the keyboard in group chats is so smart that it is mentioning the bot automatically when pressing a button, the [`cmd`](https://github.com/u32i64/vk-chat-bot/wiki/Core#cmd) handlers did not want to count it as a proper command. This is now fixed.

## [10.2.0] - 2018-08-22
### Added
- Event `service_action` - see [wiki](https://github.com/u32i64/vk-chat-bot/wiki/Special-events) for details
- Added the `service_action` event to stats

### Changed
- Improve log messages
- `core.help()` now just returns the help message generated when the bot starts, instead of regenerating it each time
- Statistics show `??h ??m ??s` instead of seconds
- Fix name: `vk-chat-bot` is more framework than a library

## [10.1.1] - 2018-08-19
### Changed
- New log style

## [10.1.0] - 2018-08-19
### Added
- Event `start`: triggers when the message's payload is `{"command":"start"}` (when user pressed the `Start` button)
- Accordingly, added the `start` event to stats

### Changed
- Refactor statistics (use object to keep track of event counts)
- Statistics no longer show empty at startup, instead `Stats initialized` shows up
- Use `package.json` `"files"` field instead of `.npmignore`
- Tarball will now include the source map
- Update dependencies

## [10.0.4] - 2018-08-07
### Changed
- Update dependencies

## [10.0.3] - 2018-07-19
### Changed
- Update dependencies

## [10.0.2] - 2018-07-08
### Fixed
- Revert to using `require('colors')`

## [10.0.1] - 2018-07-08
### Changed
- Now using `import 'colors'` instead of `require('colors')`

### Fixed
- README example issue

## [10.0.0] - 2018-07-07
### Changed
- The way how the bot is created is a bit different (see [wiki](https://github.com/u32i64/vk-chat-bot/wiki/) for details or below for migration guide)

### Fixed
- Put warning when calling `no_match` event back in

### Migration Guide (from [v9.3.1](#931---2018-07-05))
**Instead of:**
```js
const ChatBot = require('vk-chat-bot')
```
```js
var params = {/* ... */}
```
```js
var bot = new ChatBot(params)
```
```js
bot.on(/* ... */)
bot.cmd(/* ... */)
bot.regex(/* ... */)

bot.noEventWarnings()
var helpMessage = bot.help()
```
```js
bot.start(/* port */)
```

**Use:**
```js
const vk = require('vk-chat-bot')
```
```js
var params = {
  /* ... */,
  port: 12345
}
```
```js
var {bot, core} = vk.bot(params)
```
```js
core.on(/* ... */)
core.cmd(/* ... */)
core.regex(/* ... */)

core.noEventWarnings()
var helpMessage = core.help()
```
```js
bot.start()
```

**Also, to get the keyboard classes and object, now use:**

```js
var Keyboard = vk.kbd.Keyboard
var Button = vk.kbd.Button
var colors = vk.kbd.colors
```

## [9.3.1] - 2018-07-05
### Fixed
- Duplication of messages when `no_match` is called

## [9.3.0] - 2018-07-05
### Added
- Keyboard tests

### Changed
- Refactored **event handling** code in `Core` - it **should be faster now**
- Improved API call queue processing. Now processing does not start when another is already in progress
- Renamed `Behavior` to `Core`
- No log messages while `process.env.TEST_MODE` is `true` (it is set by `test/test.js`)

### Fixed
- Only one handler per event is allowed (it already was so, but now, when you try to add another one, it throws an error)

## [9.2.0] - 2018-07-04
### Added
- Keyboard support :tada: (see [`Context`](https://github.com/u32i64/vk-chat-bot/wiki/Context#keyboard) and [`Keyboard`](https://github.com/u32i64/vk-chat-bot/wiki/Keyboard) wiki pages for usage guide)

## [9.1.1] - 2018-07-04
### Fixed
- Fixed `vk_api_key` -> `vk_token` in [`README.md`](https://github.com/u32i64/vk-chat-bot#readme) (this was changed in back in [`v7.0.0`](#700---2018-06-28))

## [9.1.1] - 2018-07-04
### Changed
- Updated `babel-polyfill` **->** `@babel/polyfill`

## [9.1.0] - 2018-07-04
### Changed
- Now using `babel`, `rollup`, and `uglify-js` to be able to use latest ES features.

## [9.0.1] - 2018-07-03
### Added
- `handler_error` events to the statistics

### Changed
- Moved files around in `src`

## [9.0.0] - 2018-07-03
### Added
- Log errors in handlers as warnings
- `handler_error` event, which gets called if an error is thrown in a handler

### Changed
- Renamed `APIBuffer` to [`Context`](https://github.com/u32i64/vk-chat-bot/wiki/Context)
- Use `async`/`await` in `API`, `Context` and `Behavior`. See the [wiki page for `API#scheduleCall`](https://github.com/u32i64/vk-chat-bot/wiki/API#schedulecall) to learn more about the new usage
- [`API#scheduleCall`](https://github.com/u32i64/vk-chat-bot/wiki/API#schedulecall) now, instead of returning the full JSON, returns a `Promise`, which, if the call was completed successfully, resolves with `json.response`
- No duplicate stats anymore. The bot will log stats only if they changed (not taking uptime into account)
- Empty stats are printed right after Stats object initializes

### Fixed
- Check if the API call was successful now rejects only if `response` is `null` or `undefined`, because values like `0` or `false` are ok

## [8.3.2] - 2018-07-02
### Added
- Some package keywords

### Changed
- Show only error code and message when API error happens
- Log the full JSON if it's neither a `response` nor an `error`
- When no message is sent due to `message_deny` event, make a warning instead of information
- The name of the main library file changed from `vk-chat-bot.js` to `main.js` (`package.json` changed accordingly)

### Fixed
- When receiving an unsupported event, do not produce an error, just make a warning (this is not fatal)

## [8.3.1] - 2018-07-02
### Changed
- [`ChatBot#noEventWarnings`](https://github.com/u32i64/vk-chat-bot/wiki/Chat-Bot#noeventwarnings) function now warns that warnings are disabled (once)

## [8.3.0] - 2018-07-02
### Added
- [`ChatBot#noEventWarnings`](https://github.com/u32i64/vk-chat-bot/wiki/Chat-Bot#noeventwarnings) function to suppress warnings about "no matching **event** ... handler found"

### Changed
- When warning about "don't know how to respond to ...", replace `\n` with `\\n` to make log nicer

## [8.2.2] - 2018-07-02
### Changed
- Improve token permission check error message

## [8.2.1] - 2018-07-02
### Fixed
- Revert to using bluebird promises

## [8.2.0] - 2018-07-02
### Changed
- Now using native promises instead of bluebird (`request-promise` -> `request-promise-native`)
- In promises, emit warnings, not errors
- Statistics formatting and colors

### Fixed
- Check if the message was actually sent, and if that is not the case, emit a warning

## [8.1.0] - 2018-07-02
### Changed
- Now, instead of spamming the log like crazy, the bot will collect some stats and log them each **~10s** (see [Logging](https://github.com/u32i64/vk-chat-bot/wiki/Logging) wiki for more information).

## [8.0.0] - 2018-07-01
### Added
- [`APIBuffer#noAutoSend`](https://github.com/u32i64/vk-chat-bot/wiki/API-Buffer#noautosend) function
- More information and warnings to the log, changed error symbol from `[!]` to `[!!]` (see [Logging](https://github.com/u32i64/vk-chat-bot/wiki/Logging) wiki for more information)

### Changed
- **Starting from this version, the bot will prevent adding behavior if it is already running!**
- The way bot processes the API call queue

## [7.0.0] - 2018-06-28
### Changed
- Renamed `vk_api_key` to `vk_token` in [Params object](https://github.com/u32i64/vk-chat-bot/wiki/Chat-Bot#params-object).
- Updated order of parameters in [`Chat-Bot#cmd`](https://github.com/u32i64/vk-chat-bot/wiki/Chat-Bot#cmd).
- Added some colors to the output
- Improved error handling

## [6.0.0] - 2018-06-19
### Changed
- Updated to VK API version `5.80`
- APIBuffer now uses Peer ID instead of User ID
- `uid` -> `pid`
- `setUid()` -> [`setPid()`](https://github.com/u32i64/vk-chat-bot/wiki/API-Buffer#setpid)

## [5.4.0] - 2018-02-18
### Changed
- Bot now checks if the token has the `messages` permission when initialized and logs the check result.

## [5.3.0] - 2017-12-28
### Added
- [`API.scheduleCall()`](https://github.com/u32i64/vk-chat-bot/wiki/API#schedulecall) method

### Changed
- [`APIBuffer.send()`](https://github.com/u32i64/vk-chat-bot/wiki/API-Buffer#send) uses [`API.scheduleCall()`](https://github.com/u32i64/vk-chat-bot/wiki/API#schedulecall) it now
- Improved command detection

## [5.2.0] - 2017-12-25
### Added
- Attachment functionality, see [API Buffer wiki](https://github.com/u32i64/vk-chat-bot/wiki/API-Buffer) for more information.

## [5.1.0] - 2017-12-24
### Added
- Some tests

### Changed
- Improved parameter checks

### Fixed
- Some tests

## [5.0.0] - 2017-12-16
### Added
- [API Buffer](https://github.com/u32i64/vk-chat-bot/wiki/API-Buffer)

## [4.0.0] - 2017-12-15
### Changed
- Now using classes

Now use:
```js
const ChatBot = require('vk-chat-bot');

var params = {/* ... */}
bot = new ChatBot(params);
```

Instead of:
```js
const bot = require('vk-chat-bot');

var params = {/* ... */}
bot.init(params);
```

## [3.1.0] - 2017-12-10
### Added
- Help message generation based on commands' descriptions (`help` function)

## [3.0.0] - 2017-12-04
### Added
- Support for `message_reply` event

### Changed
- Full objects now passed to handlers

## [2.1.0] - 2017-12-03
### Added
- `no_match` event

### Fixed
- Check if `message_deny` event and don't send a message if it is

## [2.0.0] - 2017-12-03
### Changed
- Behavior-defenition function names: `event` -> `on`; `on` -> `cmd`; `onlike` -> `regex`
- Simplified `null` and `undefined` checks

## [1.0.1] - 2017-12-02
### First version!

# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

**Note:** Patch versions prior to 8.0.0 are not listed here (adding them won't be easy, since they're not documented anywhere except commit messages).

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

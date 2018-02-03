/* eslint-env mocha */

const assert = require('assert')

const ChatBot = require('../src/vk-chat-bot.js')
const log = new (require('../src/log.js'))()

var botParams = {
  vk_api_key: 'test',
  confirmation_token: 'test',
  group_id: 'test',
  secret: 'test',
  cmd_prefix: '/'
}

describe('Log', () => {
  describe('#error()', () => {
    it('throws error', () => {
      assert.throws(() => {
        log.error('Test error')
      }, Error)
    })
  })

  describe('#requireFunction()', () => {
    it('error when argument is not a function', () => {
      assert.throws(() => {
        log.requireFunction('not-a-function')
      }, Error)
    })

    it('no error when argument is a function', () => {
      assert.doesNotThrow(() => {
        log.requireFunction($ => {})
      }, Error)
    })
  })

  describe('#requireParams()', () => {
    it('error when at least one argument is invalid', () => {
      assert.throws(() => {
        log.requireParams('test', undefined, null)
      }, Error)
    })

    it('no error when all arguments are valid', () => {
      assert.doesNotThrow(() => {
        log.requireParams('test', 'a', 'b')
      }, Error)
    })
  })
})

describe('ChatBot', () => {
  describe('#constructor()', () => {
    it('error when missing required params', () => {
      assert.throws(() => {
        /* eslint-disable no-new */
        new ChatBot({
          group_id: 'test',
          cmd_prefix: 'test'
        })
        /* eslint-enable no-new */
      }, Error)
    })

    it('no error when everything\'s right', () => {
      assert.doesNotThrow(() => {
        /* eslint-disable no-new */
        new ChatBot(botParams)
        /* eslint-enable no-new */
      }, Error)
    })
  })

  describe('#start()', () => {
    it('error when no port specified', () => {
      assert.throws(() => {
        var bot = new ChatBot(botParams)
        bot.start()
      }, Error)
    })

    it('no error when everything\'s right', () => {
      assert.doesNotThrow(() => {
        var bot = new ChatBot(botParams)
        bot.start(12345)
      }, Error)
    })
  })
})

describe('Behavior', () => {
  describe('#on()', () => {
    it('error when event name is wrong', () => {
      assert.throws(() => {
        var bot = new ChatBot(botParams)
        bot.on('', () => {})
      }, Error)
    })

    it('error when missing parameters', () => {
      assert.throws(() => {
        var bot = new ChatBot(botParams)
        bot.on('no_match')
      }, Error)
    })

    it('no error when everything\'s right', () => {
      assert.doesNotThrow(() => {
        var bot = new ChatBot(botParams)
        bot.on('no_match', ($) => {})
      }, Error)
    })
  })

  describe('#cmd()', () => {
    it('error missing parameters', () => {
      assert.throws(() => {
        var bot = new ChatBot(botParams)
        bot.cmd('test')
      }, Error)
    })

    it('no error when everything\'s right (3 params)', () => {
      assert.doesNotThrow(() => {
        var bot = new ChatBot(botParams)
        bot.cmd('test', 'sure thing tests something', ($) => {})
      }, Error)
    })

    it('no error when everything\'s right (2 params)', () => {
      assert.doesNotThrow(() => {
        var bot = new ChatBot(botParams)
        bot.cmd('test', ($) => {})
      }, Error)
    })
  })

  describe('#regex()', () => {
    it('error when missing parameters', () => {
      assert.throws(() => {
        var bot = new ChatBot(botParams)
        bot.regex('.*')
      }, Error)
    })

    it('no error when everything\'s right', () => {
      assert.doesNotThrow(() => {
        var bot = new ChatBot(botParams)
        bot.regex('.*', ($) => {})
      }, Error)
    })
  })

  describe('#help()', () => {
    it('should return a proper help message', () => {
      var bot = new ChatBot(botParams)

      bot.cmd('test', 'sure thing tests something', ($) => {})
      bot.cmd('help', 'shows the help message', ($) => {})

      var message = '\n/test - sure thing tests something\n/help - shows the help message\n'
      assert.equal(bot.help(), message)
    })
  })
})

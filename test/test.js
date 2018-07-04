import test from 'ava'

const ChatBot = require('../src/main')
const log = new (require('../src/extra/log'))()

var botParams = {
  vk_token: 'test',
  confirmation_token: 'test',
  group_id: 'test',
  secret: 'test',
  cmd_prefix: '/'
}

test('Log#error() throws error', t => {
  t.throws(() => {
    log.error('Test error')
  })
})

test('Log#requireFunction() error when argument is not a function', t => {
  t.throws(() => {
    log.requireFunction('not-a-function')
  })
})

test('Log#requireFunction() no error when argument is a function', t => {
  t.notThrows(() => {
    log.requireFunction($ => {})
  })
})

test('Log#requireParams() error when at least one argument is invalid', t => {
  t.throws(() => {
    log.requireParam('test', undefined, 'something')
  })
})

test('Log#requireParams() no error when all arguments are valid', t => {
  t.notThrows(() => {
    log.requireParam('test', 'thing', 'something')
  })
})

test('ChatBot#constructor() error when missing required params', t => {
  t.throws(() => {
    /* eslint-disable no-new */
    new ChatBot({
      group_id: 'test',
      cmd_prefix: 'test'
    })
    /* eslint-enable no-new */
  })
})

test('ChatBot#constructor() no error when everything\'s right', t => {
  t.notThrows(() => {
    /* eslint-disable no-new */
    new ChatBot(botParams)
    /* eslint-enable no-new */
  })
})

test('ChatBot#start() error when no port specified', t => {
  t.throws(() => {
    var bot = new ChatBot(botParams)
    bot.start()
  })
})

test('ChatBot#start() no error when everything\'s right', t => {
  t.notThrows(() => {
    var bot = new ChatBot(botParams)
    bot.start(12345)
  })
})

test('Behavior#on() error when event name is wrong', t => {
  t.throws(() => {
    var bot = new ChatBot(botParams)
    bot.on('', () => {})
  })
})

test('Behavior#on() error when missing parameters', t => {
  t.throws(() => {
    var bot = new ChatBot(botParams)
    bot.on('no_match')
  })
})

test('Behavior#on() no error when everything\'s right', t => {
  t.notThrows(() => {
    var bot = new ChatBot(botParams)
    bot.on('no_match', $ => {})
  })
})

test('Behavior#cmd() error missing parameters', t => {
  t.throws(() => {
    var bot = new ChatBot(botParams)
    bot.cmd('test')
  })
})

test('Behavior#cmd() no error when everything\'s right (3 params)', t => {
  t.notThrows(() => {
    var bot = new ChatBot(botParams)
    bot.cmd('test', $ => {}, 'sure thing tests something')
  })
})

test('Behavior#cmd() no error when everything\'s right (2 params)', t => {
  t.notThrows(() => {
    var bot = new ChatBot(botParams)
    bot.cmd('test', $ => {})
  })
})

test('Behavior#regex() error when missing parameters', t => {
  t.throws(() => {
    var bot = new ChatBot(botParams)
    bot.regex(/.*/)
  })
})

test('Behavior#regex() no error when everything\'s right', t => {
  t.notThrows(() => {
    var bot = new ChatBot(botParams)
    bot.regex(/.*/, $ => {})
  })
})

test('Behavior#help() should return a proper help message', t => {
  var bot = new ChatBot(botParams)

  bot.cmd('test', $ => {}, 'sure thing tests something')
  bot.cmd('help', $ => {}, 'shows the help message')

  var message = '\n/test - sure thing tests something\n/help - shows the help message\n'
  t.is(bot.help(), message)
})

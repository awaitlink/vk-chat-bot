import test from 'ava'

import vk from '../src/main'
import {error, requireParam, requireFunction} from '../src/extra/log'

var Keyboard = vk.kbd.Keyboard
var Button = vk.kbd.Button
var colors = vk.kbd.colors

var botParams = {
  vk_token: 'test',
  confirmation_token: 'test',
  group_id: 'test',
  secret: 'test',
  port: 12345,
  cmd_prefix: '/'
}

process.env.TEST_MODE = true

// Log

test('Log#error() throws error', t => {
  t.throws(() => {
    error('Test error')
  })
})

test('Log#requireFunction() error when argument is not a function', t => {
  t.throws(() => {
    requireFunction('not-a-function')
  })
})

test('Log#requireFunction() no error when argument is a function', t => {
  t.notThrows(() => {
    requireFunction($ => {})
  })
})

test('Log#requireParams() error when argument is invalid', t => {
  t.throws(() => {
    requireParam('test', undefined, 'something')
  })
})

test('Log#requireParams() no error when argument is valid', t => {
  t.notThrows(() => {
    requireParam('test', 'thing', 'something')
  })
})

// Bot

test('vk.bot() error when missing required params', t => {
  t.throws(() => {
    vk.bot({
      group_id: 'test',
      cmd_prefix: 'test'
    })
  })
})

test('Bot#constructor() no error when everything\'s right', t => {
  t.notThrows(() => {
    vk.bot(botParams)
  })
})

// Core

test('Core#on() error when event name is wrong', t => {
  t.throws(() => {
    var obj = vk.bot(botParams)
    obj.core.on('', () => {})
  })
})

test('Core#on() error when missing parameters', t => {
  t.throws(() => {
    var obj = vk.bot(botParams)
    obj.core.on('no_match')
  })
})

test('Core#on() no error when everything\'s right', t => {
  t.notThrows(() => {
    var obj = vk.bot(botParams)
    obj.core.on('no_match', $ => {})
  })
})

test('Core#cmd() error missing parameters', t => {
  t.throws(() => {
    var obj = vk.bot(botParams)
    obj.core.cmd('test')
  })
})

test('Core#cmd() no error when everything\'s right (3 params)', t => {
  t.notThrows(() => {
    var obj = vk.bot(botParams)
    obj.core.cmd('test', $ => {}, 'sure thing tests something')
  })
})

test('Core#cmd() no error when everything\'s right (2 params)', t => {
  t.notThrows(() => {
    var obj = vk.bot(botParams)
    obj.core.cmd('test', $ => {})
  })
})

test('Core#regex() error when missing parameters', t => {
  t.throws(() => {
    var obj = vk.bot(botParams)
    obj.core.regex(/.*/)
  })
})

test('Core#regex() no error when everything\'s right', t => {
  t.notThrows(() => {
    var obj = vk.bot(botParams)
    obj.core.regex(/.*/, $ => {})
  })
})

test('Core#help() should return a proper help message', t => {
  var obj = vk.bot(botParams)

  obj.core.cmd('test', $ => {}, 'sure thing tests something')
  obj.core.cmd('help', $ => {}, 'shows the help message')

  var message = '\n/test - sure thing tests something\n/help - shows the help message\n'
  t.is(obj.core.help(), message)
})

// Keyboard

test('Keyboard#getJSON should return valid keyboard JSON (empty keyboard)', t => {
  var kbd = new Keyboard()

  t.is(
    JSON.stringify(kbd.getJSON()),
    JSON.stringify({
      one_time: false,
      buttons: []
    })
  )
})

test('Keyboard#getJSON should return valid keyboard JSON (2 rows, 2 buttons, one time)', t => {
  var kbd = new Keyboard([
    [new Button('1'), new Button('2', colors.primary, {pay: 'load'})],
    [new Button('3', colors.negative), new Button('4', colors.positive)]
  ], true)

  t.is(
    JSON.stringify(kbd.getJSON()),
    JSON.stringify({
      one_time: true,
      buttons: [
        [
          {action: {type: 'text', label: '1'}, color: 'default'},
          {action: {type: 'text', label: '2', payload: '{"pay":"load"}'}, color: 'primary'}
        ],
        [
          {action: {type: 'text', label: '3'}, color: 'negative'},
          {action: {type: 'text', label: '4'}, color: 'positive'}
        ]
      ]
    })
  )
})

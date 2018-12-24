import test from 'ava';

import vk from '../src/main';

const { colors, Keyboard, Button } = vk.kbd;

const botParams = {
  vkToken: 'test',
  confirmationToken: 'test',
  groupId: 'test',
  secret: 'test',
  port: 12345,
  cmdPrefix: '/',
};

process.env.TEST_MODE = true;

// Log

test('LogMessageBuilder -> error() throws error', (t) => {
  t.throws(() => {
    vk.log.log().from('test').error('Test error').now();
  });
});

test('log.requireFunction() error when argument is not a function', (t) => {
  t.throws(() => {
    vk.log.requireFunction('not-a-function');
  });
});

test('log.requireFunction() no error when argument is a function', (t) => {
  t.notThrows(() => {
    vk.log.requireFunction(() => {});
  });
});

test('log.requireParams() error when argument is invalid', (t) => {
  t.throws(() => {
    vk.log.requireParam('test', undefined, 'something');
  });
});

test('log.requireParams() no error when argument is valid', (t) => {
  t.notThrows(() => {
    vk.log.requireParam('test', 'thing', 'something');
  });
});

// Bot

test('vk.bot() error when missing required params', (t) => {
  t.throws(() => {
    vk.bot({
      groupId: 'test',
      cmdPrefix: 'test',
    });
  });
});

test('Bot#constructor() no error when everything\'s right', (t) => {
  t.notThrows(() => {
    vk.bot(botParams);
  });
});

// Core

test('Core#on() error when event name is wrong', (t) => {
  t.throws(() => {
    const obj = vk.bot(botParams);
    obj.core.on('', () => {});
  });
});

test('Core#on() error when missing parameters', (t) => {
  t.throws(() => {
    const obj = vk.bot(botParams);
    obj.core.on('no_match');
  });
});

test('Core#on() no error when everything\'s right', (t) => {
  t.notThrows(() => {
    const obj = vk.bot(botParams);
    obj.core.on('no_match', () => {});
  });
});

test('Core#cmd() error missing parameters', (t) => {
  t.throws(() => {
    const obj = vk.bot(botParams);
    obj.core.cmd('test');
  });
});

test('Core#cmd() no error when everything\'s right (3 params)', (t) => {
  t.notThrows(() => {
    const obj = vk.bot(botParams);
    obj.core.cmd('test', () => {}, 'sure thing tests something');
  });
});

test('Core#cmd() no error when everything\'s right (2 params)', (t) => {
  t.notThrows(() => {
    const obj = vk.bot(botParams);
    obj.core.cmd('test', () => {});
  });
});

test('Core#regex() error when missing parameters', (t) => {
  t.throws(() => {
    const obj = vk.bot(botParams);
    obj.core.regex(/.*/);
  });
});

test('Core#regex() no error when everything\'s right', (t) => {
  t.notThrows(() => {
    const obj = vk.bot(botParams);
    obj.core.regex(/.*/, () => {});
  });
});

test('Core#help() should return a proper help message', (t) => {
  const obj = vk.bot(botParams);

  obj.core.cmd('test', () => {}, 'sure thing tests something');
  obj.core.cmd('help', () => {}, 'shows the help message');

  obj.core.lock();

  const message = '\n/test - sure thing tests something\n/help - shows the help message\n';
  t.is(obj.core.help(), message);
});

// Keyboard

test('Keyboard should make a valid keyboard JSON (empty keyboard)', (t) => {
  const kbd = new Keyboard();

  t.is(
    JSON.stringify(kbd),
    JSON.stringify({
      one_time: false,
      buttons: [],
    }),
  );
});

test('Keyboard should make a valid keyboard JSON (2 rows, 2 buttons, one time)', (t) => {
  const kbd = new Keyboard([
    [new Button('1'), new Button('2', colors.primary, { pay: 'load' })],
    [new Button('3', colors.negative), new Button('4', colors.positive)],
  ], true);

  t.is(
    JSON.stringify(kbd),
    JSON.stringify({
      one_time: true,
      buttons: [
        [
          { action: { type: 'text', label: '1' }, color: 'default' },
          { action: { type: 'text', label: '2', payload: '{"pay":"load"}' }, color: 'primary' },
        ],
        [
          { action: { type: 'text', label: '3' }, color: 'negative' },
          { action: { type: 'text', label: '4' }, color: 'positive' },
        ],
      ],
    }),
  );
});

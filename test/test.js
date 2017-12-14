const assert = require('assert');

const bot = require('../src/vk-chat-bot.js');
const logging = require('../src/logging.js');
const api = require('../src/api.js');

describe('logging', () => {
  describe('#terminate()', () => {
    it('should throw an Error', () => {
      assert.throws(() => {
        logging.terminate();
      }, Error);
    });
  });
});

describe('api', () => {
  describe('#send()', () => {
    it('should return false when no API key is set', () => {
      assert.equal(api.send('test', 'test'), false);
    });

    it('should return true when everything\'s right', () => {
      api.setKey('test');
      assert.equal(api.send('test', 'test'), true);
    });
  });
});

describe('vk-chat-bot', () => {
  describe('#init()', () => {
    it('should throw an Error with no params', () => {
      assert.throws(() => {
        bot.init();
      }, Error);
    });

    it('should throw an Error with wrong params', () => {
      assert.throws(() => {
        bot.init({
          group_id: "test",
          cmd_prefix: "test"
        });
      }, Error);
    });
  });

  describe('#start()', () => {
    it('should throw an Error when no port specified', () => {
      assert.throws(() => {
        bot.start();
      }, Error);
    });

    it('should throw an Error when not initialized', () => {
      assert.throws(() => {
        bot.start(12345);
      }, Error);
    });
  });

  describe('#init()', () => {
    it('shouldn\'t throw an Error when everything\'s right', () => {
      assert.doesNotThrow(() => {
        var params = {
          vk_api_key: "test",
          confirmation_token: "test",
          group_id: "test",
          secret: "test",
          cmd_prefix: "/"
        };

        bot.init(params);
      }, Error);
    });
  });

  describe('#start()', () => {
    it('shouldn\'t throw an Error when everything\'s right', () => {
      assert.doesNotThrow(() => {
        bot.start(12345);
      }, Error);
    });
  });
});

describe('behavior', () => {
  describe('#on()', () => {
    it('should throw an error with wrong event name', () => {
      assert.throws(() => {
        bot.on("", () => {});
      }, Error);
    });

    it('should throw an error with missing parameters', () => {
      assert.throws(() => {
        bot.on("no_match");
      }, Error);
    });

    it('shouldn\'t throw an error when everything\'s right', () => {
      assert.doesNotThrow(() => {
        bot.on("no_match", "shows the help message", (msg, obj) => {});
      }, Error);
    });
  });

  describe('#cmd()', () => {
    it('should throw an error with missing parameters', () => {
      assert.throws(() => {
        bot.cmd("test");
      }, Error);
    });

    it('shouldn\'t throw an error when everything\'s right', () => {
      assert.doesNotThrow(() => {
        bot.cmd("test", "sure thing tests something", (msg, obj) => {});
        bot.cmd("help", "shows the help message", (msg, obj) => {});
      }, Error);
    });
  });

  describe('#regex()', () => {
    it('should throw an error with missing parameters', () => {
      assert.throws(() => {
        bot.regex(".*");
      }, Error);
    });

    it('shouldn\'t throw an error when everything\'s right', () => {
      assert.doesNotThrow(() => {
        bot.regex(".*", (msg, obj) => {});
      }, Error);
    });
  });

  describe('#help()', () => {
    it('should return a proper help message', () => {
      message = "\n/test - sure thing tests something\n/help - shows the help message\n";

      assert.equal(bot.help(), message);
    });
  });
});

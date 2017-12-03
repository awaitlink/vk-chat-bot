// Replace with require('vk-chat-bot') if you installed using npm
const bot = require('../src/vk-chat-bot.js');

// Server port
const port = process.env.PORT;

var params = {
  vk_api_key: process.env.VK_API_KEY,

  // Confirmation parameters, can be found in group Callback API settings
  confirmation_token: process.env.CONFIRMATION_TOKEN,
  group_id: process.env.GROUP_ID,

  // Secret key, set it in group Callback API settings
  secret: process.env.SECRET,

  // Command prefix, optional
  cmd_prefix: process.env.CMD_PREFIX
}

bot.init(params);

bot.on("message_allow", (uid) => {
  return "Hello, thanks for allowing us to send you messages.";
});

bot.cmd("test", (msg) => {
  return "Test success! Your message content (excluding command) was: \"" + msg + "\".";
});

bot.regex("(hi|hello|hey)", (msg) => {
  return "Hello, I am a test bot.";
});

bot.start(port);

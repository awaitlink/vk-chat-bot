const bot = require('vk-chat-bot');

// Server port
const port = process.env.PORT;

var params = {
  vk_api_key: process.env.VK_API_KEY,

  // Confirmation parameters, can be found in group Callback API settings
  confirmation_token: process.env.CONFIRMATION_TOKEN,
  group_id: process.env.GROUP_ID,

  // Secret key, set in group Callback API settings
  secret: process.env.SECRET,

  // Command prefix, optional
  cmd_prefix: process.env.CMD_PREFIX
}

bot.init(params);

bot.event("message_allow", (uid) => {
  return "Hello, thanks for allowing us to send you messages.";
});

bot.on("test", (msg) => {
  return "Test success! Your message was: \"" + msg + "\".";
});

bot.onlike("(hi|hello|hey)", (msg) => {
  return "Hello, I am a bot.";
});

bot.start(port);

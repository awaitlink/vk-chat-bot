This guide will walk you step-by-step through deploying an example chat bot (which can be found in the [u32i64/vk-chat-bot-example](https://github.com/u32i64/vk-chat-bot-example) repository) for a community using [Heroku](https://heroku.com).

## 1. Setting up Heroku
- Visit [signup.heroku.com](https://signup.heroku.com/) and **create an account** there.
- After completing the registration process, visit your [Heroku Dashboard](https://dashboard.heroku.com/apps).
- Create a **new app** with any name that is available.

![New App]

![New App Dialog]

## 2. Setting up a VK community
- Visit [vk.com/groups](https://vk.com/groups), click `Create community`, and fill in the details:

![Create a community]

- In your community, go to `Manage`.
- Go to `Messages` tab, and **enable** community messages.
- In `Messages` -> `Bot settings` enable `Bot abilities`, and then enable `Add start button`.
- Go to `Settings` -> `API usage`.
- Create a **new access token** by clicking `Create token`. Make sure to check this box:

![New Token]

- **Save** your new **token** somewhere.
- Now switch to the `Callback API` -> `Server settings` tab.
- Set the API version to `5.80`.
- In the `Secret key` field, enter **your own** random combination of characters.
- Click `Save` below that field.
- Go back to `Server settings` tab and enter in the `URL` field: **https://**`your-app-name`**.herokuapp.com/** (Replace `your-app-name` with the name you specified when creating a new Heroku app in **step 1**).
- **Don't** press `Confirm` and **don't** close this page yet.

![Callback API settings]

## 3. Setting up environment variables in Heroku

- Open the `Settings` tab in your Heroku app, click `Reveal Config Vars`, and **add variables**, as follows:

Variable name | Description | Example value
--- | --- | ---
`VK_API_KEY` | The **token** you saved earlier into somewhere | -
`SECRET` | **Secret key** | `r4nd0m_53cr37_k3y`
`GROUP_ID` | **Number** that comes after `"group_id":` | `123456789`
`CONFIRMATION_TOKEN` | **String** that comes after `String to be returned:` | `f1234567`
`CMD_PREFIX` | Any command prefix | `/`

## 4. Creating the bot

- Make sure you have [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#download-and-install) installed.
- Open up terminal (console), and execute the following commands (assuming your project name on Heroku is `some-random-chat-bot`):

```bash
# Clone the example repository
git clone https://github.com/u32i64/vk-chat-bot-example.git

# Go inside the newly-created folder
cd vk-chat-bot-example

# Log in to Heroku
heroku login

# Add the heroku remote
heroku git:remote -a some-random-chat-bot

# Finally, push the bot to Heroku
git push -u heroku master
```

## 5. Final steps
- Go to your app's **logs** (in Heroku app dashboard -> `More` -> `View logs`)
- If you see a **log message** like the one below, then the bot has launched successfully:
```console
  bot info Server is listening on port 12345
```
If something is not working, feel free to [open an issue](https://github.com/u32i64/vk-chat-bot/issues) on GitHub.
- Now go back to VK's **Callback API settings**, and press the `Confirm` button.
- Also, in the `Event types` tab, **check** the following boxes:

![Event types]

## 6. Ready!
- Congratulations, you have just made your own VK chat bot!

## 7. What's next?
- Take a look at other pages of the documentation - to understand how the example bot works
- Change or implement new behavior in your bot - see [Core]{@link Core} docs
- If you have any questions, feature requests or bugs - create an [issue](https://github.com/u32i64/vk-chat-bot/issues)

[New App]: https://github.com/u32i64/vk-chat-bot/raw/master/tutorials/images/heroku_guide/new-app.png
[New App Dialog]: https://github.com/u32i64/vk-chat-bot/raw/master/tutorials/images/heroku_guide/new-app-dialog.png
[Create a community]: https://github.com/u32i64/vk-chat-bot/raw/master/tutorials/images/heroku_guide/new-community.png
[New Token]: https://github.com/u32i64/vk-chat-bot/raw/master/tutorials/images/heroku_guide/new-token.png
[Callback API settings]: https://github.com/u32i64/vk-chat-bot/raw/master/tutorials/images/heroku_guide/callback-api.png
[Event types]: https://github.com/u32i64/vk-chat-bot/raw/master/tutorials/images/heroku_guide/event-types.png

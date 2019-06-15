import { log } from '../extra/log';
import API from './api';
import { Keyboard } from './keyboard';

export default class Context {
  /**
   * API.
   * @type {API}
   * @memberof Context
   */
  public readonly api: API;

  /**
   * Full object passed by Callback API.
   *
   * **Note:** If `message_new`, `message_reply`, `message_edit` or `no_match` event,
   * this is a [Private message object](https://vk.com/dev/objects/message).
   * Else, see [Callback API docs](https://vk.com/dev/callback_api) or
   * [Groups Events docs](https://vk.com/dev/groups_events) for more information.
   * @type {Object}
   * @memberof Context
   */
  public readonly obj: any;

  /**
   * Incoming user message.
   * **Note:** If `cmd()` handler, contains message without `cmd_prefix` and the command
   * @type {string}
   * @memberof Context
   */
  public msg: string;

  // TODO: Should be readonly
  /**
   * Name of the event.
   * @type {string}
   * @memberof Context
   */
  public readonly eventType: string;

  /**
   * Does this `Context`'s response need auto-sending?
   * @readonly
   * @see Context#noAutoSend
   * @type {boolean}
   * @memberof Context
   */
  private autoSend: boolean = true;

  /**
   * The ID of a peer, to which the reply is going to be sent
   *
   * **Note:** You can change this using [`setPid()`](#setpid) method,
   * the original Peer ID is available in `$.obj.peer_id`
   * @readonly
   * @type {string|number}
   * @memberof Context
   */
  private pid: any;

  /**
   * Text, which will be used in the reply
   * @type {string}
   * @memberof Context
   */
  private replyText: any;

  /**
   * Attachment, which will be used in the reply
   * @type {string}
   * @memberof Context
   */
  private attachment: any;

  /**
   * Object of the [Keyboard]{@link Keyboard}, which will be used in the reply
   * @type {Object}
   * @memberof Context
   */
  private kbdObject: string;

  /**
   * @class Context
   *
   * @param {API} api the API object
   * @param {string} eventType the event type
   * @param {Object} object full object from Callback API
   * @param {string} message the message
   *
   * @return {Context}
   *
   * @classdesc
   * Context, which is passed to every [handler]{@link handler}
   */
  constructor(api: API, eventType: string, object: object, message: string) {
    this.api = api;
    this.obj = object;
    this.msg = message;
    this.eventType = eventType;
    this.clear();
  }

  /**
   * Prevents this handler from sending the message automatically after it finishes.
   *
   * @memberof Context
   * @instance
   */
  public noAutoSend() {
    this.autoSend = false;
  }

  /**
   * Prevents this handler from sending the message automatically after it finishes.
   *
   * @memberof Context
   * @instance
   */
  public needsAutoSend() {
    return this.autoSend;
  }

  /**
   * Sets a new peer ID.
   *
   * @param {string|number} pid new peer ID
   * @memberof Context
   * @instance
   */
  public setPid(pid: string | number) {
    this.pid = pid;
  }

  /**
   * Sets the reply message text.
   *
   * @param {string} txt new text
   * @memberof Context
   * @instance
   */
  public text(txt: string) {
    this.replyText = txt;
  }

  /**
   * Adds an attachment to the message.
   * **Note:** More information on the parameters can be found in
   * [VK API docs](https://vk.com/dev/messages.send)
   *
   * @param {string} type the type of attachment
   * @param {string|number} ownerId resource owner ID
   * @param {string|number} resId resource ID
   * @param {string} [accessKey] resource access key, if needed;
   * see [Access Key](https://vk.com/dev/access_key) page in API docs for more information
   * @memberof Context
   * @instance
   */
  public attach(
    type: string,
    ownerId: string | number,
    resId: string | number,
    accessKey: string,
  ) {
    if (accessKey) {
      this.attachment.push(`${type}${ownerId}_${resId}_${accessKey}`);
    } else {
      this.attachment.push(`${type}${ownerId}_${resId}`);
    }
  }

  /**
   * Attaches a keyboard.
   *
   * @param {Keyboard} kbd the keyboard
   * @memberof Context
   * @instance
   *
   * @example
   *
   * const { colors, Keyboard, Button } = vk.kbd;
   *
   * core.cmd('keyboard', $ => {
   *     // Set 'true' instead of 'false' to make it disappear after a button was pressed
   *     var kbd = new Keyboard([
   *         // Rows
   *         [
   *             button.text('Default'),
   *             button.text('Primary', colors.primary),
   *             button.text('Negative', colors.negative),
   *             button.text('Positive', colors.positive)
   *         ],
   *         [
   *             button.text('Maximum rows is 10, columns - 4.')
   *         ],
   *    ], false);
   *
   *    $.text('Here is your keyboard, as promised.');
   *    $.keyboard(kbd);
   * }, 'demo keyboard');
   */
  public keyboard(kbd: Keyboard) {
    this.kbdObject = JSON.stringify(kbd);
  }

  /**
   * Attaches an empty keyboard.
   *
   * @memberof Context
   * @instance
   */
  public removeKeyboard() {
    this.keyboard(new Keyboard());
  }

  /**
   * Sends the composed message to user.
   * **Note:** After the handler finishes its work, this method is called automatically
   * (if [noAutoSend]{@link Context#noAutoSend} was not called)
   *
   * @memberof Context
   * @instance
   * @see Context#noAutoSend
   */
  public async send() {
    if (this.eventType === 'message_deny') {
      log()
        .w(`No message was sent to peer ${this.pid} ("message_deny" event)`)
        .from('ctx')
        .now();
      return;
    }

    if (this.replyText === '' && this.attachment === []) {
      log()
        .w(
          `No message was sent to peer ${
            this.pid
          } (text or attachment is required)`,
        )
        .from('ctx')
        .now();
      return;
    }

    const attachmentList = this.attachment.join(',');

    /* eslint-disable-next-line consistent-return */
    return this.api.send(
      this.pid,
      this.replyText,
      attachmentList,
      this.kbdObject,
    );
  }

  /**
   * Clears the buffer and resets the User ID back to original.
   * For example, after calling this you can compose another message to the same user
   *
   * @memberof Context
   * @instance
   */
  public clear() {
    this.replyText = '';
    this.attachment = [];
    this.kbdObject = '';

    if (this.eventType === 'message_allow') {
      this.pid = this.obj.user_id;
    } else if (this.eventType === 'message_typing_state') {
      this.pid = this.obj.from_id;
    } else {
      this.pid = this.obj.peer_id;
    }
  }
}

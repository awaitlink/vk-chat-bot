/**
 * @file A part of `vk-chat-bot` node.js framework
 * @author Artem Varaksa <aymfst@gmail.com>
 * @copyright Artem Varaksa 2017-2018
 */

/**
 * @module api/context
 */

import { Keyboard } from './keyboard'
import { warn, requireParam } from '../extra/log'
import '@babel/polyfill'

export default class Context {
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
   * Context, which is passed to every [handler]{@link module:core~handler}
   */
  constructor (api, eventType, object, message) {
    /**
     * API
     * @type {API}
     * @memberof module:api/context~Context
     */
    this.api = api

    /**
     * Full object passed by Callback API
     *
     * **Note:** If `message_new`, `message_reply`, `message_edit` or `no_match` event, this is a [Private message object](https://vk.com/dev/objects/message).
     * Else, see [Callback API docs](https://vk.com/dev/callback_api) or [Groups Events docs](https://vk.com/dev/groups_events) for more information.
     * @type {Object}
     * @memberof module:api/context~Context
     */
    this.obj = object

    /**
     * Incoming user message
     * **Note:** If `cmd()` handler, contains message without `cmd_prefix` and the command
     * @type {string}
     * @memberof module:api/context~Context
     */
    this.msg = message

    /**
     * Name of the event
     * @type {string}
     * @memberof module:api/context~Context
     */
    this.eventType = eventType

    /**
     * Does this `Context`'s response need auto-sending?
     * @readonly
     * @see module:api/context~Context#noAutoSend
     * @type {boolean}
     * @memberof module:api/context~Context
     */
    this.autoSend = true

    this.clear()
  }

  /**
   * Prevents this handler from sending the message automatically after it finishes
   *
   * @memberof module:api/context~Context
   * @instance
   */
  noAutoSend () {
    this.autoSend = false
  }

  /**
   * Sets a new peer ID
   *
   * @param {string|number} pid new peer ID
   * @memberof module:api/context~Context
   * @instance
   */
  setPid (pid) {
    this._pid = pid
  }

  /**
   * Sets the reply message text
   *
   * @param {string} txt new text
   * @memberof module:api/context~Context
   * @instance
   */
  text (txt) {
    this._replyText = txt
  }

  /**
   * Adds an attachment to the message
   * **Note:** More information on the parameters can be found in [VK API docs](https://vk.com/dev/messages.send)
   *
   * @param {string} type the type of attachment
   * @param {string|number} ownerId resource owner ID
   * @param {string|number} resId resource ID
   * @param {string} [accessKey] resource access key, if needed; see [Access Key](https://vk.com/dev/access_key) page in API docs for more information
   * @memberof module:api/context~Context
   * @instance
   */
  attach (type, ownerId, resId, accessKey) {
    requireParam('Context#attach', type, 'attachment type')
    requireParam('Context#attach', ownerId, 'owner id')
    requireParam('Context#attach', resId, 'resource id')

    if (accessKey) {
      this._attachment.push(`${type}${ownerId}_${resId}_${accessKey}`)
    } else {
      this._attachment.push(`${type}${ownerId}_${resId}`)
    }
  }

  /**
   * Attaches a keyboard
   *
   * @param {Keyboard} kbd the keyboard
   * @memberof module:api/context~Context
   * @instance
   *
   * @example
   *
   * var Keyboard = vk.kbd.Keyboard
   * var Button = vk.kbd.Button
   * var colors = vk.kbd.colors
   *
   * core.cmd('keyboard', $ => {
   *     // Set 'true' instead of 'false' to make it disappear after a button was pressed
   *     var kbd = new Keyboard([
   *         // Rows
   *         [
   *             new Button('Default'),
   *             new Button('Primary', colors.primary),
   *             new Button('Negative', colors.negative),
   *             new Button('Positive', colors.positive)
   *         ],
   *         [
   *             new Button('Maximum rows is 10, columns - 4.')
   *         ],
   *    ], false)
   *
   *    $.text('Here is your keyboard, as promised.')
   *    $.keyboard(kbd)
   * }, 'demo keyboard')
   */
  keyboard (kbd) {
    this._kbdObject = JSON.stringify(kbd)
  }

  /**
   * Attaches an empty keyboard
   *
   * @memberof module:api/context~Context
   * @instance
   */
  removeKeyboard () {
    this.keyboard(new Keyboard())
  }

  /**
   * Sends the composed message to user
   * **Note:** After the handler finishes its work, this method is called automatically (if [noAutoSend]{@link module:api/context~Context#noAutoSeng} was not called)
   *
   * @memberof module:api/context~Context
   * @instance
   */
  async send () {
    if (this.eventType === 'message_deny') {
      warn('ctx', `No message was sent to peer ${this._pid} ("message_deny" event)`)
      return
    }

    if (this._replyText === '' && this._attachment === []) {
      warn('ctx', `No message was sent to peer ${this._pid} (text or attachment is required)`)
      return
    }

    var attachmentList = this._attachment.join(',')
    return this.api.send(this._pid, this._replyText, attachmentList, this._kbdObject)
  }

  /**
   * Clears the buffer and resets the User ID back to original
   * For example, after calling this you can compose another message to the same user
   *
   * @memberof module:api/context~Context
   * @instance
   */
  clear () {
    /**
     * Text, which will be used in the reply
     * @private
     * @type {string}
     * @memberof module:api/context~Context
     */
    this._replyText = ''

    /**
     * Attachment, which will be used in the reply
     * @private
     * @type {string}
     * @memberof module:api/context~Context
     */
    this._attachment = []

    /**
     * Object of the [Keyboard]{@link module:api/keyboard~Keyboard}, which will be used in the reply
     * @private
     * @type {Object}
     * @memberof module:api/context~Context
     */
    this._kbdObject = ''

    if (this.eventType === 'message_allow') {
      /**
       * The ID of a peer, to which the reply is going to be sent
       *
       * **Note:** You can change this using [`setPid()`](#setpid) method, the original Peer ID is available in `$.obj.peer_id`
       * @private
       * @type {string|number}
       * @memberof module:api/context~Context
       */
      this._pid = this.obj.user_id
    } else if (this.eventType === 'message_typing_state') {
      this._pid = this.obj.from_id
    } else {
      this._pid = this.obj.peer_id
    }
  }
}

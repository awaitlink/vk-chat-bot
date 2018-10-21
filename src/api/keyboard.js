/**
 * @file A part of `vk-chat-bot` node.js framework
 * @author Artem Varaksa <aymfst@gmail.com>
 * @copyright Artem Varaksa 2017-2018
 */

/**
 * Classes for creating keyboards
 *
 * Get the `Keyboard` and `Button` classes and `colors` object from the `vk` object:
 *
 * ```js
 * const vk = require('vk-chat-bot')
 *
 * var Keyboard = vk.kbd.Keyboard
 * var Button = vk.kbd.Button
 * var colors = vk.kbd.colors
 * ```
 *
 * See full keyboard example in [Context#keyboard]{@link module:api/context~Context#keyboard}
 *
 * @module api/keyboard
 */

export class Keyboard {
  /**
   * @class Keyboard
   * @see module:api/keyboard
   *
   * @param {Button[][]} [buttons=[]] array of arrays (rows) of buttons
   * @param {boolean} [oneTime=false] show only once? (or disappear after button press?)
   * @return {Keyboard}
   *
   * @classdesc
   * See full keyboard example in [Context#keyboard]{@link module:api/context~Context#keyboard}
   *
   * @example
   * var kbd = new Keyboard([
   *    // One row
   *    [
   *      new Button('Maximum rows is 10, columns - 4.')
   *    ],
   * ])
   */
  constructor (buttons = [], oneTime = false) {
    /**
     * Is this keyboard one-time?
     * @readonly
     * @type {boolean}
     * @memberof module:api/keyboard~Keyboard
     */
    this.one_time = oneTime

    /**
     * Items of this keyboard
     * @readonly
     * @type {Button[][]}
     * @memberof module:api/keyboard~Keyboard
     */
    this.buttons = buttons
  }
}

export class Button {
  /**
   * @class Button
   * @see module:api/keyboard
   *
   * @param {string} [label="Button"] button label
   * @param {string} [color="default"] button color
   * @param {string} [payload=""] button payload, see [VK bots docs](https://vk.com/dev/bots_docs_3) **->** Section **4.3** for more details
   * @return {Button}
   *
   * @example
   * new Button('Default')
   * new Button('Default', colors.default)
   * new Button('Default', colors.default, {a: "b"})
   *
   * new Button('Primary', colors.primary)
   * new Button('Negative', colors.negative)
   * new Button('Positive', colors.positive)
   */
  constructor (label = 'Button', color = 'default', payload = '') {
    /**
     * This button's `action`
     * @type {Object}
     * @memberof module:api/keyboard~Button
     */
    this.action = {
      type: 'text',
      label: label.toString()
    }

    /**
     * This button's color
     * @type {string}
     * @memberof module:api/keyboard~Button
     */
    this.color = color

    if (payload) {
      /**
       * This button's payload
       * @type {string}
       * @memberof module:api/keyboard~Button
       */
      this.action.payload = JSON.stringify(payload)
    }
  }
}

/**
 * Colors of buttons
 * @readonly
 * @enum {string}
 */
export var colors = {
  /**
   * Primary color
   */
  primary: 'primary',

  /**
   * Default color
   */
  default: 'default',

  /**
   * Negative color
   */
  negative: 'negative',

  /**
   * Positive color
   */
  positive: 'positive'
}

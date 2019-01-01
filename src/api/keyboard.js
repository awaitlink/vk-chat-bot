/**
 * @file A part of `vk-chat-bot` node.js framework.
 * Defines the {@link Keyboard} and {@link Button} classes
 * and {@link colors} of buttons.
 *
 * @author Artem Varaksa <aymfst@gmail.com>
 * @copyright Artem Varaksa 2017-2019
 */

export class Keyboard {
  /**
   * @class Keyboard
   *
   * @param {Button[][]} [buttons=[]] array of arrays (rows) of buttons
   * @param {boolean} [oneTime=false] show only once? (or disappear after button press?)
   * @return {Keyboard}
   *
   * @classdesc
   * See full keyboard example in [Context#keyboard]{@link Context#keyboard}
   *
   * @example
   * var kbd = new Keyboard([
   *    // One row
   *    [
   *      new Button('Maximum rows is 10, columns - 4.')
   *    ],
   * ])
   */
  constructor(buttons = [], oneTime = false) {
    /**
     * Is this keyboard one-time?
     * @readonly
     * @type {boolean}
     * @memberof Keyboard
     */
    this.one_time = oneTime;

    /**
     * Items of this keyboard
     * @readonly
     * @type {Button[][]}
     * @memberof Keyboard
     */
    this.buttons = buttons;
  }
}

export class Button {
  /**
   * @class Button
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
  constructor(label = 'Button', color = 'default', payload = '') {
    /**
     * This button's `action`
     * @type {Object}
     * @memberof Button
     */
    this.action = {
      type: 'text',
      label: label.toString(),
    };

    /**
     * This button's color
     * @type {string}
     * @memberof Button
     */
    this.color = color;

    if (payload) {
      /**
       * This button's payload
       * @type {string}
       * @memberof Button
       */
      this.action.payload = JSON.stringify(payload);
    }
  }
}

/**
 * Colors of buttons in a keyboard
 * @readonly
 * @type {Object}
 * @property {string} primary the primary color
 * @property {string} default the default color
 * @property {string} negative the negative color
 * @property {string} positive the positive color
 */
export const colors = {
  primary: 'primary',
  default: 'default',
  negative: 'negative',
  positive: 'positive',
};

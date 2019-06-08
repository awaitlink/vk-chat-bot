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
   *      Button.text('Maximum rows is 10, columns - 4.')
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

/**
 * @class Button
 */
export const Button = {
  /**
   * @memberof Button
   *
   * @param {string} [label="Button"] button label
   * @param {string} [color="secondary"] button color
   * @param {string} [payload=""] button payload, see [VK bots docs](https://vk.com/dev/bots_docs_3) **->** Section **4.3** for more details
   *
   * @return {Button}
   *
   * @example
   * Button.text('Secondary')
   * Button.text('Secondary', colors.secondary)
   * Button.text('Secondary', colors.secondary, {a: "b"})
   *
   * Button.text('Primary', colors.primary)
   * Button.text('Negative', colors.negative)
   * Button.text('Positive', colors.positive)
   */
  text(label = 'Button', color = 'secondary', payload = '') {
    const btn = {
      action: {
        type: 'text',
        label: label.toString(),
      },
      color,
    };

    if (payload) {
      btn.action.payload = JSON.stringify(payload);
    }

    return btn;
  },

  /**
   * @memberof Button
   *
   * @param {string} [payload=""] button payload, see [VK bots docs](https://vk.com/dev/bots_docs_3) **->** Section **4.3** for more details
   *
   * @return {Button}
   *
   * @example
   * Button.location({a: "b"})
   */
  location(payload = '') {
    const btn = {
      action: {
        type: 'location',
      },
    };

    if (payload) {
      btn.action.payload = JSON.stringify(payload);
    }

    return btn;
  },

  /**
   * @memberof Button
   *
   * @param {string} [hash] VK Pay parameters and app id in parameter `aid`, delimited by `&`, see [VK Pay actions](https://vk.com/dev/vk_pay_actions)
   *
   * @return {Button}
   *
   * @example
   * Button.vkPay('action=transfer-to-group&group_id=1&aid=10')
   */
  vkPay(hash) {
    const btn = {
      action: {
        type: 'vkpay',
        hash,
      },
    };

    return btn;
  },

  /**
   * @memberof Button
   *
   * @param {integer} [appId] Application ID
   * @param {integer} [ownerId=null] Group ID, if app needs to be opened in group context
   * @param {string} [label] Button label
   * @param {string} [hash] Parameters for app navigation
   *
   * @return {Button}
   *
   * @example
   * Button.openApp(1, 1, 'My App', 'test')
   */
  openApp(appId, ownerId = null, label, hash) {
    const btn = {
      action: {
        type: 'open_app',
        app_id: appId,
        label,
        hash,
      },
    };

    if (ownerId) {
      btn.action.owner_id = ownerId;
    }

    return btn;
  },
};

/**
 * Colors of buttons in a keyboard
 * @readonly
 * @type {Object}
 * @property {string} primary the primary color
 * @property {string} secondary the secondary color
 * @property {string} negative the negative color
 * @property {string} positive the positive color
 */
export const colors = {
  primary: 'primary',
  secondary: 'secondary',
  negative: 'negative',
  positive: 'positive',
};

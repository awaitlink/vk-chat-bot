/**
 * @file A part of `vk-chat-bot` Node.js framework.
 * Defines the {@link API} class.
 *
 * @author Artem Varaksa <aymfst@gmail.com>
 * @copyright Artem Varaksa 2017-2019
 */

import '@babel/polyfill';
import { log, requireParam } from '../extra/log';

const request = require('request-promise');
const crypto = require('crypto');

export default class API {
  /**
   * @class API
   * @classdesc
   *
   * Used to call API methods
   *
   * You can get the `API` object from a `Context` object:
   * ```js
   * // Assuming your Context object is $
   * var api = $.api
   * ```
   *
   * Or from `core` (after initialization with [bot]{@link bot}:
   * ```js
   * var api = core.api
   * ```
   *
   * @param {string} vkToken VK API token
   * @param {Stats} stats statistics object
   *
   * @return {API}
   */
  constructor(vkToken, stats) {
    requireParam('API#constructor', vkToken, 'VK API token');
    requireParam('API#constructor', stats, 'statistics object');

    /**
     * VK API token
     * @type {string}
     * @memberof API
     */
    this.vkToken = vkToken;

    /**
     * Stats object
     * @readonly
     * @type {Stats}
     * @memberof API
     */
    this.stats = stats;

    /**
     * VK API version used by API
     * @type {string}
     * @memberof API
     */
    this.API_VERSION = '5.92';

    /**
     * API quota, in requests per second
     * @type {number}
     * @memberof API
     */
    this.API_QUOTA = 20;

    /**
     * Queue of scheduled API calls
     * @type {Object[]}
     * @memberof API
     */
    this.queue = [];

    /**
     * Is the queue being processed now?
     * @type {boolean}
     * @memberof API
     */
    this.isQueueProcessing = false;

    if (!process.env.TEST_MODE) {
      // Check permissions
      this.checkPermissions()
        .then((e) => { log().i(e).from('api').now(); })
        .catch((e) => { log().w(e).from('api').now(); });

      // Start the queue processing
      setInterval(() => {
        if (!this.isQueueProcessing) {
          this.isQueueProcessing = true;
          this.processQueue()
            .then(() => {
              this.isQueueProcessing = false;
            })
            .catch((e) => {
              log().w(e).from('api').now();
              this.isQueueProcessing = false;
            });
        }
      }, 1000);
    }
  }

  /**
   * Checks if the required permissions for bot to work properly are present,
   * and emits a warning if that is not the case.
   * @memberof API
   * @instance
   */
  async checkPermissions() {
    // Check if the token has the required permissions
    const response = await this.scheduleCall('groups.getTokenPermissions', {});

    const { permissions } = response;

    let ok = false;
    permissions.forEach((permission) => {
      if (permission.name === 'messages') {
        ok = true;
      }
    });

    if (!ok) {
      return Promise.reject(new Error('Token permission "messages" is missing. Bot will be unable to send any messages'));
    }
    return Promise.resolve('Token permission "messages" is present');
  }

  /**
   * Move forward through the queue, processing at most [API_QUOTA]{@link API#API_QUOTA} items
   * @memberof API
   * @instance
   */
  async processQueue() {
    if (this.queue) {
      for (let i = 1; i <= this.API_QUOTA; i += 1) {
        if (this.queue.length === 0) {
          break;
        }

        const e = this.queue.shift();

        /* eslint-disable-next-line no-await-in-loop */
        const json = await this.call(e.method, e.params);

        if (json.response !== undefined && json.response !== null) {
          e.resolve(json.response);
        } else if (json.error) {
          const errorCode = json.error.error_code;
          const errorMsg = json.error.error_msg;

          e.reject(`An API call to method '${e.method}' failed due to an API error #${errorCode}: ${errorMsg}`);
        } else {
          e.reject(`An API call to method '${e.method}' failed due to an unknown API error. The API responded with: ${JSON.stringify(json)}`);
        }
      }

      return Promise.resolve();
    }

    return Promise.reject(new Error('No queue for API calls found'));
  }

  /**
  * Schedules a call to a VK API Method
  *
  * After the call completes, a check will be performed to see if the call was successful or not,
  * and in the latter case a warning will be logged
  *
  * @memberof API
  * @instance
  *
  * @param {string} method VK API method name
  * @param {Object} params parameters for the method,
  * `access_token` and `v` will be added automatically
  *
  * @return {Promise} promise, which resolves with `json.response` when the request is completed
  * and a response is given, and rejects if an error happened
  *
  * @example
  * core.cmd('info', async $ => {
  *    var uid = $.obj.from_id
  *
  *  // Call VK API to get information about the user
  *    var response = await $.api.scheduleCall('users.get', { user_ids: uid })
  *    var userInfo = response[0]

  *    var name = userInfo.first_name
  *    var surname = userInfo.last_name
  *
  *  $.text(`User ID: ${uid}\nName: ${name} ${surname}`)
  * })
  */
  async scheduleCall(method, params) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        method,
        params,
        resolve,
        reject,
      });
    });
  }

  /**
   * Call a VK API Method
   *
   * **It is highly recommended to use [API#scheduleCall]{@link API#scheduleCall}
   * instead to not exceed the API quota and to check whether the call was successful or not!**
   * @memberof API
   * @instance
   * @see API#scheduleCall
   *
   * @param {string} method VK API method name
   * @param {Object} params parameters for the method,
   * `access_token` and `v` will be added automatically
   *
   * @return {Promise} promise
   *
   * @example
   * core.cmd('info', async $ => {
   *    var uid = $.obj.from_id
   *
   *    // Call VK API to get information about the user
   *    var json = await $.api.call('users.get', { user_ids: uid })
   *    var userInfo = json.response[0]

   *    var name = userInfo.first_name
   *    var surname = userInfo.last_name
   *
   *  $.text(`User ID: ${uid}\nName: ${name} ${surname}`)
   * })
   */
  async call(method, params) {
    const url = `https://api.vk.com/method/${encodeURIComponent(method)}`;

    const options = {
      uri: url,
      json: true,
      qs: {
        access_token: this.vkToken,
        v: this.API_VERSION,
      },
    };

    Object.keys(params).forEach((e) => { options.qs[e] = params[e]; });

    const promise = request(options);

    promise.catch((err) => {
      log().w(`Error occured while calling API method '${method}': ${err}`).from('api').now();
    });

    return promise;
  }

  /**
   * Sends a message to a user via User ID
   *
   * **Note that it is much easier to use the [Context]{@link Context} object passed to handlers
   * to compose and send messages, keyboards and attachments!**
   * @memberof API
   * @instance
   * @see Context
   *
   * @param {string|number} pid peer ID
   * @param {string} [message] message text **(required, if attachment is empty)**
   * @param {string} [attachment] list of attachments, comma-separated
   * (see [VK API Docs](https://vk.com/dev/messages.send) for further information)
   * **(required if message is empty)**
   * @param {string} [keyboard] json of keyboard
   *
   * @return {Promise} promise
   *
   * @example
   * await api.send(1, 'Hello!', 'photo6492_456240778')
   */
  async send(pid, message, attachment, keyboard) {
    const params = {
      peer_id: pid,
    };

    if (message) params.message = message;
    if (attachment) params.attachment = attachment;
    if (keyboard) params.keyboard = keyboard;

    /* global BigInt */
    params.random_id = BigInt.asIntN(64, BigInt(`0x${crypto.randomBytes(6).toString('hex')}`)).toString();

    return new Promise((resolve) => {
      this.scheduleCall('messages.send', params)
        .then(() => {
          this.stats.sent();
          resolve();
        })
        .catch((e) => {
          log().w(e).from('api').now();
          resolve();
        });
    });
  }
}

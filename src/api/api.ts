import crypto from 'crypto';
import request from 'request-promise';
import { log } from '../extra/log';
import Stats from '../extra/stats';

/**
 * VK API version used by API.
 */
const API_VERSION = '5.95';
/**
 * API quota, in requests per second
 */
const API_QUOTA = 20;

export default class API {
    /**
   * VK API token.
   */
    private vkToken: string;

    /**
   * Stats object.
   */
    private stats: Stats;

    /**
   * Queue of scheduled API calls.
   */
    private queue: {
        method: string;
        params: {[key: string]: string};
        resolve: Function;
        reject: Function;
    }[] = [];

    /**
   * Is the queue being processed now?
   */
    private isQueueProcessing: boolean = false;

    /**
   * Used to call API methods.
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
   * @param vkToken VK API token
   * @param stats statistics object
   */
    public constructor(vkToken: string, stats: Stats) {
        this.vkToken = vkToken;
        this.stats = stats;

        // Check permissions
        this.checkPermissions()
            .then((e): void => {
                log()
                    .i(e)
                    .from('api')
                    .now();
            })
            .catch((e): void => {
                log()
                    .w(e)
                    .from('api')
                    .now();
            });

        // Start the queue processing
        setInterval((): void => {
            if (!this.isQueueProcessing) {
                this.isQueueProcessing = true;
                this.processQueue()
                    .then((): void => {
                        this.isQueueProcessing = false;
                    })
                    .catch((e): void => {
                        log()
                            .w(e)
                            .from('api')
                            .now();
                        this.isQueueProcessing = false;
                    });
            }
        }, 1000);
    }

    /**
   * Schedules a call to a VK API Method.
   *
   * After the call completes, a check will be performed to see if the call was successful or not,
   * and in the latter case a warning will be logged.
   *
   * @param method VK API method name
   * @param params parameters for the method, `access_token` and `v` will be added automatically
   *
   * @return promise, which resolves with `json.response` when the request is completed
   * and a response is given, and rejects if an error happened
   *
   * @example
   * ```
   * core.cmd('info', async $ => {
   *    var uid = $.obj.from_id;
   *
   *    // Call VK API to get information about the user
   *    var response = await $.api.scheduleCall('users.get', { user_ids: uid });
   *    var userInfo = response[0];
   *
   *    var name = userInfo.first_name;
   *    var surname = userInfo.last_name;
   *
   *  $.text(`User ID: ${uid}\nName: ${name} ${surname}`);
   * });
   * ```
   */
    public async scheduleCall(method: string, params: { [key: string]: string }): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        return new Promise((resolve, reject): void => {
            this.queue.push({
                method,
                params,
                resolve,
                reject,
            });
        });
    }

    /**
   * Call a VK API Method.
   *
   * **It is highly recommended to use [API#scheduleCall](#scheduleCall)
   * instead to not exceed the API quota and to check whether the call was successful or not!**
   *
   * @param method VK API method name
   * @param params parameters for the method, `access_token` and `v` will be added automatically
   *
   * @example
   * ```
   * core.cmd('info', async $ => {
   *    var uid = $.obj.from_id;
   *
   *    // Call VK API to get information about the user
   *    var json = await $.api.call('users.get', { user_ids: uid });
   *    var userInfo = json.response[0];
   *
   *    var name = userInfo.first_name;
   *    var surname = userInfo.last_name;
   *
   *  $.text(`User ID: ${uid}\nName: ${name} ${surname}`);
   * });
   * ```
   */
    public async call(
        method: string,
        params: { [key: string]: string },
    ): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        const url = `https://api.vk.com/method/${encodeURIComponent(method)}`;

        const options = {
            uri: url,
            json: true,
            qs: {
                access_token: this.vkToken, // eslint-disable-line @typescript-eslint/camelcase
                v: API_VERSION,
                ...params,
            },
        };

        const promise = request(options);

        promise.catch((err: Error): void => {
            log()
                .w(`Error occured while calling API method '${method}': ${err}`)
                .from('api')
                .now();
        });

        return promise;
    }

    /**
   * Sends a message to a user via Peer ID.
   *
   * **Note that it is much easier to use the [Context]{@link Context} object passed to handlers
   * to compose and send messages, keyboards and attachments!**
   *
   * @param pid peer ID
   * @param message message text **(required, if attachment is empty)**
   * @param attachment list of attachments, comma-separated
   * (see [VK API Docs](https://vk.com/dev/messages.send) for further information)
   * **(required if message is empty)**
   * @param keyboard json of keyboard
   *
   * @example
   * ```
   * await api.send(1, 'Hello!', 'photo6492_456240778')
   * ```
   */
    public async send(
        pid: string | number,
        message: string,
        attachment: string,
        keyboard: string,
    ): Promise<void> {
        /* global BigInt */

        const params: {
            peer_id: string;
            message?: string;
            attachment?: string;
            keyboard?: string;
            random_id: string;
        } = {
            peer_id: pid.toString(), // eslint-disable-line @typescript-eslint/camelcase
            random_id: BigInt.asIntN( // eslint-disable-line @typescript-eslint/camelcase
                32,
                BigInt(`0x${crypto.randomBytes(6).toString('hex')}`),
            ).toString(),
        };

        if (message) {
            params.message = message;
        }
        if (attachment) {
            params.attachment = attachment;
        }
        if (keyboard) {
            params.keyboard = keyboard;
        }

        return new Promise((resolve): void => {
            this.scheduleCall('messages.send', params)
                .then((): void => {
                    this.stats.sent();
                    resolve();
                })
                .catch((e): void => {
                    log()
                        .w(e)
                        .from('api')
                        .now();
                    resolve();
                });
        });
    }

    /**
   * Checks if the required permissions for bot to work properly are present,
   * and emits a warning if that is not the case.
   */
    private async checkPermissions(): Promise<string> {
    // Check if the token has the required permissions
        const response = await this.scheduleCall('groups.getTokenPermissions', {});

        const { permissions } = response;

        let ok = false;
        permissions.forEach((permission: any): void => { // eslint-disable-line @typescript-eslint/no-explicit-any
            if (permission.name === 'messages') {
                ok = true;
            }
        });

        if (!ok) {
            return Promise.reject(
                new Error(
                    'Token permission `messages` is missing. Bot will be unable to send any messages',
                ),
            );
        }
        return Promise.resolve('Token permission `messages` is present');
    }

    /**
   * Move forward through the queue, processing at most [API_QUOTA](../modules/_api_api_.html#api_quota) items
   */
    private async processQueue(): Promise<void> {
        if (this.queue) {
            for (let i = 1; i <= API_QUOTA; i += 1) {
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

                    e.reject(
                        `An API call to method '${
                            e.method
                        }' failed due to an API error #${errorCode}: ${errorMsg}`,
                    );
                } else {
                    e.reject(
                        `An API call to method '${
                            e.method
                        }' failed due to an unknown API error. The API responded with: ${JSON.stringify(
                            json,
                        )}`,
                    );
                }
            }

            return Promise.resolve();
        }

        return Promise.reject(new Error('No queue for API calls found'));
    }
}

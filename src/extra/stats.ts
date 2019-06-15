import chalk from 'chalk';
import moment from 'moment';
import { log } from './log';
// tslint:disable-next-line: no-var-requires
require('moment-duration-format')(moment);

export default class Stats {
    /**
   * Count of requests from the Callback API.
   */
    public rx: number = 0;

    /**
   * Count of messages sent.
   */
    public tx: number = 0;

    /**
   * Count of various events.
   */
    /* eslint-disable @typescript-eslint/camelcase */
    public eventCounters: { [key: string]: number } = {
        message_new: 0,
        message_reply: 0,
        message_edit: 0,
        message_typing_state: 0,
        message_allow: 0,
        message_deny: 0,

        start: 0,
        service_action: 0,

        no_match: 0,
        handler_error: 0,
    };
    /* eslint-enable @typescript-eslint/camelcase */

    /**
   * Previous stats log message, without time
   */
    public previous: string = '';

    /**
   * Stats stores and prints statistics.
   *
   * The bot logs statistics each **~10s** (if they changed):
   *
   *  ```console
   *   stat info [12y 34d 12h 34m 56s] rx:32 tx:16 | allow/deny:5/0 typing:3 new:7(start:2 action:1)
   *                                                 edit:1 | reply:16 | no_match:0 err:0
   *  ```
   *
   * ### General statistics
   *
   * Statistics | Description
   * --- | ---
   * `[...]` | Process uptime
   * `rx` | Amount of received events from Callback API
   * `tx` | Amount of sent messages
   *
   * ### Callback API event statistics
   * Statistics | Description
   * --- | ---
   * `new` | `message_new` events
   * `allow` | `message_allow` events
   * `deny` | `message_deny` events
   * `edit` | `message_edit` events
   * `reply` | `message_reply` events
   * `typing` | `message_typing_state` events
   *
   * ### Other event statistics
   * Statistics | Description
   * --- | ---
   * `start` | `start` events
   * `action` | `service_action` events
   * `no_match` | `no_match` events
   * `err` | `handler_error` events
   *
   */
    public constructor() {
        log()
            .i('Stats initialized')
            .from('stat')
            .now();

        setInterval((): void => {
            this.print();
        }, 10000);
    }

    /**
   * This is used to tell `Stats` that a message was sent.
   */
    public sent(): void {
        this.tx += 1;
    }

    /**
   * This is used to tell `Stats` that an event was emitted.
   */
    public event(eventName: string): void {
        this.rx += 1;
        this.eventCounters[eventName] += 1;

        const internalEvents = [
            'start',
            'service_action',
            'no_match',
            'handler_error',
        ];
        if (internalEvents.includes(eventName)) {
            this.rx -= 1; // Not from Callback API
        }
    }

    /**
   * Returns how much events of this type were emitted.
   */
    private getEventCount(eventName: string): string {
        return this.eventCounters[eventName].toString();
    }

    /**
   * Prints the statistics if they changed.
   */
    private print(): void {
        const rx = chalk.underline.green(this.rx.toString());
        const tx = chalk.underline.cyan(this.tx.toString());

        const mn = chalk.green(this.getEventCount('message_new'));
        const ma = chalk.green(this.getEventCount('message_allow'));
        const md = chalk.red(this.getEventCount('message_deny'));
        const me = chalk.green(this.getEventCount('message_edit'));
        const mr = chalk.cyan(this.getEventCount('message_reply'));
        const mts = chalk.green(this.getEventCount('message_typing_state'));

        const st = chalk.green(this.getEventCount('start'));
        const sa = chalk.green(this.getEventCount('service_action'));

        const nm = chalk.bold.magenta(this.getEventCount('no_match'));
        const he = chalk.bold.magenta(this.getEventCount('handler_error'));

        const up = moment
            .duration(process.uptime(), 'seconds')
            .format('y[y] d[d] h[h] m[m] s[s]');
        // tslint:disable-next-line: max-line-length
        let message = `rx:${rx} tx:${tx} | allow/deny:${ma}/${md} typing:${mts} new:${mn}(start:${st} action:${sa}) edit:${me} | reply:${mr} | no_match:${nm} err:${he}`;

        if (message === this.previous) {
            return;
        }
        this.previous = message;

        message = `[${up}] ${message}`;

        log()
            .i(message)
            .from('stat')
            .now();
    }
}

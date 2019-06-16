import escapeRegex from 'escape-string-regexp';
import Context from './api/context';
import { log } from './extra/log';

import API from './api/api';
import Stats from './extra/stats';

export type Handler = ($: Context) => void | Promise<void>;

export type Payload = any; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * @param payloadJson the stringified JSON of the payload (as given by Callback API)
 * @param payload the JS object that was made by parsing the `payloadJson`, if the
 * parsing was successful
 */
export type Tester = (payloadJson: string, payload?: Payload) => boolean;

interface DynPayloadHandler {
    tester: Tester;
    handler: Handler;
}

interface CommandHandler {
    command: string;
    description: string;
    handler: Handler;
}

/**
 * Dispatches message handling to appropriate handlers,
 * and is used for setting these handlers.
 *
 * Handlers for the `message_new` event will be searched in this order:
 * 1. If service action message => [[on]] handler for the `service_action` event
 * 1. If user pressed the `Start` button => [[on]] handler for the `start` event
 * 1. [[payload]]
 * 1. [[cmd]]
 * 1. [[regex]]
 *
 * For other events, a matching [[on]] handler will be called.
 */
export default class Core {
    public readonly api: API;
    public readonly stats: Stats;

    /**
     * Command prefix.
     */
    private cmdPrefix: string;

    /**
     * Group ID.
     */
    private groupId: string;

    /**
     * Command prefix, escaped for usage in regular expressions
     */
    private escapedCmdPrefix: string;

    /**
     * Is this `Core` locked?
     */
    private locked: boolean = false;

    /**
     * Handlers for events.
     */
    /* eslint-disable @typescript-eslint/camelcase */
    private eventHandlers: { [key: string]: Handler } = {
        // Callback API
        message_new: null,
        message_reply: null,
        message_edit: null,
        message_typing_state: null,
        message_allow: null,
        message_deny: null,

        // Detected when parsing 'message_new' event
        start: null,
        service_action: null,

        // Internal events
        no_match: null,
        handler_error: null,
    };
    /* eslint-enable @typescript-eslint/camelcase */

    /**
     * Exact payload handlers.
     */
    private exactPayloadHandlers: { [key: string]: Handler } = {};

    /**
     * Dynamic payload handlers.
     * (those which use functions to determine whether a handler is suitable)
     */
    private dynPayloadHandlers: DynPayloadHandler[] = [];

    /**
     * Command handlers.
     */
    private commandHandlers: CommandHandler[] = [];

    /**
     * Regular expression handlers.
     */
    private regexHandlers: { regex: RegExp; handler: Handler }[] = [];

    /**
     * Are event warnings enabled?
     */
    private eventWarnings: boolean = true;

    /**
     * The help message.
     */
    private helpMessage: string = '';

    /**
     * Creates a new [[Core]].
     * @param api [[API]] object
     * @param stats [[Stats]] object
     * @param cmdPrefix command prefix
     * @param groupId group ID
     */
    public constructor(
        api: API,
        stats: Stats,
        cmdPrefix: string,
        groupId: string | number,
    ) {
        this.api = api;
        this.stats = stats;
        this.cmdPrefix = cmdPrefix;
        this.escapedCmdPrefix = escapeRegex(this.cmdPrefix);
        this.groupId = escapeRegex(groupId.toString());

        this.registerMessageNewHandler();
    }

    /**
     * Disables warnings about missing event handlers.
     */
    public noEventWarnings(): void {
        this.eventWarnings = false;
        log()
            .w('Warnings about missing event handlers were disabled')
            .from('core')
            .now();
    }

    /**
     * Locks this `Core`, so new handlers can't be added,
     * and generates the help message for later usage.
     */
    public lock(): void {
        this.locked = true;
        this.generateHelpMessage();
    }

    /**
     * Registers an event handler.
     *
     * Does not work for `message_new`, as its handler is defined by `vk-chat-bot` itself.
     *
     * ### Events
     *
     * #### Callback API Events
     * Event | Description
     * ---|---
     * `message_allow` | User **allowed** sending messages to him/her
     * `message_deny` | User **disallowed** sending messages to him/her
     * `message_reply` | New **message sent** by community administrator (or by the bot itself)
     * `message_edit` | **Message edited** by user
     * `message_typing_state` | **User is typing** a message
     *
     * #### Other Events
     * Event type | When handler is called
     * ---|---
     * `start` | If the message's payload is `{"command": "start"}` (i.e. `Start` button pressed)
     * `service_action` | Service action message received
     * `no_match` | When no matching `cmd()` or `regex()` handler is found
     * `handler_error` | If an error is thrown in a handler
     *
     * #### The `service_action` event
     * > The `$.obj.action` object contains information about the service action.
     * > It contains the following fields:
     *
     * ```
     * type (string) — action type, one of:
     *    `chat_photo_update` — chat photo updated
     *    `chat_photo_remove` — chat photo removed
     *    `chat_create` — chat created
     *    `chat_title_update` — chat title updated
     *    `chat_invite_user` — user was invited to chat
     *    `chat_kick_user` — user was kicked from the chat
     *    `chat_pin_message` — a message was pinned
     *    `chat_unpin_message` — a message was unpinned
     *    `chat_invite_user_by_link` — user joined the chat by link
     *
     * member_id (integer):
     *   user id (if > 0), which was invited or kicked (if < 0, see `email` field)
     *     (`chat_invite_user`, `chat_invite_user_by_link`,  `chat_kick_user`)
     *   user id, which pinned or unpinned a message
     *     (`chat_pin_message`, `chat_unpin_message`)
     *
     * text (string):
     *   chat name
     *     (`chat_create`, `chat_title_update`)
     *
     * email (string):
     *   email, which was invited or kicked
     *     (`chat_invite_user`, `chat_kick_user`, member_id < 0)
     *
     * photo (object) — chat picture, contains:
     *     photo_50 (string): URL of image 50 x 50 px
     *     photo_100 (string): URL of image 100 x 100 px
     *     photo_200 (string): URL of image 200 x 200 px
     * ```
     *
     * @param - event name
     * @param - function which will handle the message
     *
     * @example
     * ```
     * core.on('no_match', $ => {
     *   $.text('I don\'t know how to respond to your message.');
     * });
     * ```
     */
    public on(event: string, handler: Handler): void {
        if (this.isLocked()) {
            return;
        }

        if (!Object.keys(this.eventHandlers).includes(event)) {
            log()
                .e(`Cannot register a handler: unknown event type '${event}'`)
                .from('core')
                .now();
        }

        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = handler;
        } else if (event === 'message_new') {
            log()
                .e(
                    'Cannot register a handler: handler for the `message_new` event is defined internally',
                )
                .from('core')
                .now();
        } else {
            log()
                .e(`Cannot register a handler: duplicate handler for event '${event}'`)
                .from('core')
                .now();
        }
    }

    /**
     * Registers a payload handler.
     *
     * **Note**: exact handlers are searched first, and only if they don't match,
     * the search for a dynamic handler begins.
     *
     * @param payload - exact payload to handle,
     * or a function (type [[Tester]]) which
     * will determine whether to handle the payload or not.
     * @param handler - function which will handle the message
     *
     * @example
     * ```
     * // -------> KEYBOARD (for sending the payload)
     *
     * // Create a keyboard
     * const { colors, Keyboard, Button } = vk.kbd;
     *
     * var kbd = new Keyboard([[
     *      // Clicking on this button will send the payload {a: 'b'}
     *      button.text('Test 1', colors.default, {a: 'b'}),
     *      button.text('Test 2', colors.default, {a: 'b', c: 'd'})
     * ]], false);
     *
     * // When asked, send the keyboard
     * core.regex(/keyboard/i, $ => {
     *    $.keyboard(kbd);
     *    $.text('Here it is!');
     * });
     *
     * // -------> EXACT PAYLOAD
     * core.payload({a: 'b'}, $ => {
     *    $.text('Received secret payload!');
     * });
     *
     * // -------> DYNAMIC PAYLOAD
     * // In this case, the handler will run only if the
     * // payload's property `c` contains the value `d`.
     * core.payload((payload, parsed) => {
     *    if (parsed) { // If the payload is a valid JSON
     *      return parsed.c === 'd';
     *    } else {
     *      return false;
     *    }
     * }, $ => {
     *    $.text(`In message '${$.msg}', payload.c is 'd'!`);
     * });
     * ```
     */
    public payload(payload: Payload, handler: Handler): void {
        if (this.isLocked()) {
            return;
        }

        if (typeof payload !== 'function') {
            // Exact payload match:

            if (!this.exactPayloadHandlers[JSON.stringify(payload)]) {
                this.exactPayloadHandlers[JSON.stringify(payload)] = handler;
            } else {
                log()
                    .e(
                        `Cannot register a handler: duplicate handler for payload '${payload}'`,
                    )
                    .from('core')
                    .now();
            }
        } else {
            // Dynamic payload match:

            this.dynPayloadHandlers.push({
                tester: payload,
                handler: handler,
            });
        }
    }

    /**
     * Registers a command handler.
     *
     * Handler is called if the message begins with `cmd_prefix`
     * (defined in the parameters) **+** `command`
     *
     * @param command - command
     * @param handler - function which will handle the message
     * @param description - the description of what this command does,
     * to be used in help messages.
     *
     * @example
     * ```
     * core.cmd('help', $ => {
     *   // core.help() returns the help message
     *   $.text('Test Bot' + core.help());
     * }, 'shows the help message');
     * ```
     */
    public cmd(
        command: string,
        handler: Handler,
        description: string = '',
    ): void {
        if (this.isLocked()) {
            return;
        }

        this.commandHandlers.push({
            command,
            description,
            handler: handler,
        });
    }

    /**
     * Registers a regex handler.
     *
     * @param handler - function which will handle the message
     *
     * @example
     * ```
     * core.regex(/h(i|ello|ey)/i, $ => {
     *    $.text('Hello, I am a test bot. You said: ' + $.msg);
     * });
     * ```
     */
    public regex(regex: RegExp, handler: Handler): void {
        if (this.isLocked()) {
            return;
        }

        this.regexHandlers.push({
            regex,
            handler: handler,
        });
    }

    /**
     * Parses the request, creates a [[Context]], and proceeds
     * to call [[Core.event]] to handle the event
     *
     * @param body - body of the request, in parsed JSON
     *
     */
    public async parseRequest(body: any /* TODO: body type? */): Promise<void> { // eslint-disable-line @typescript-eslint/no-explicit-any 
        const obj = body.object;
        const event = body.type;

        const $ = new Context(this.api, event, obj, obj.text);
        await this.event(event, $);
    }

    /**
     * Returns the help message.
     */
    public help(): string {
        return this.helpMessage;
    }

    /**
     * Indicates whether this `Core` is locked, and prints a message
     * to notify the user if it is locked.
     */
    private isLocked(): boolean {
        if (this.locked) {
            log()
                .w('Registering a handler while the bot is running is not allowed')
                .from('core')
                .now();
        }

        return this.locked;
    }

    /**
     * Handles an event.
     */
    private async event(name: string, $: Context): Promise<void> {
        this.stats.event(name);

        if (this.eventHandlers[name]) {
            try {
                await this.eventHandlers[name]($);

                if ($.needsAutoSend() && name !== 'message_new') {
                    await $.send();
                }
            } catch (error) {
                log()
                    .w(`Error in handler: ${error}`)
                    .from('core')
                    .now();

                if (name !== 'handler_error') {
                    await this.event('handler_error', $);
                }
            }
        } else if (this.eventWarnings) {
            log()
                .w(`No handler for event '${name}'`)
                .from('core')
                .now();
        }
    }

    /**
     * Registers a handler for `message_new` event.
     */
    private registerMessageNewHandler(): void {
        this.on('message_new', async ($: Context): Promise<void> => {
            // Check for 'service_action' event
            if ($.obj.action) {
                await this.event('service_action', $);
                return;
            }

            // Handle regular message
            if (!(await this.tryHandlePayload($))) {
                if (!(await this.tryHandleCommand($))) {
                    if (!(await this.tryHandleRegex($))) {
                        log()
                            .w(
                                `Don't know how to respond to ${JSON.stringify($.msg).replace(
                                    /\n/g,
                                    '\\n',
                                )}, calling 'no_match' event`,
                            )
                            .from('core')
                            .now();
                        await this.event('no_match', $);
                        return;
                    }
                }
            }

            if ($.needsAutoSend()) {
                await $.send();
            }
        });
    }

    /**
     * Tries to handle the message in the given `Context`
     * with a payload handler.
     *
     * @return was the message handled?
     */
    private async tryHandlePayload($: Context): Promise<boolean> {
        const { payload } = $.obj;
        if (payload) {
            // Check for 'start' event
            try {
                if (JSON.parse(payload).command === 'start') {
                    await this.event('start', $);
                    $.noAutoSend(); // Message sending was already handled by event
                    return true;
                }
            } catch (e) {
                /* JSON Parse Error */
            }

            // Check for exact payload handler
            if (this.exactPayloadHandlers[payload]) {
                await this.exactPayloadHandlers[payload]($);
                return true;
            }

            // Check for dynamic payload handler
            const handlers = this.dynPayloadHandlers
                .map((potentialHandler): DynPayloadHandler => {
                    let parsed = null;
                    try {
                        parsed = JSON.parse(payload);
                    } catch (e) {
                        /* JSON Parse Error */
                    }

                    if (potentialHandler.tester(payload, parsed)) {
                        return potentialHandler;
                    }

                    return null;
                })
                .filter(e => e); // eslint-disable-line @typescript-eslint/explicit-function-return-type

            if (handlers) {
                await handlers[0].handler($);
                return true;
            }
        }

        return false;
    }

    /**
     * Tries to handle the message in the given `Context`
     * with a command handler.
     *
     * @return was the message handled?
     */
    private async tryHandleCommand($: Context): Promise<boolean> {
        const handlerObjs = this.commandHandlers
            .map((potentialHandler): { handler: CommandHandler; msg: string } => {
                const cmd = escapeRegex(potentialHandler.command);
                const cmdRegex = new RegExp(
                    `^( *\\[club${this.groupId}\\|.*\\])?( *${this.escapedCmdPrefix}${cmd})+`, 'i',
                );

                if (cmdRegex.test($.msg)) {
                    return {
                        handler: potentialHandler,
                        msg: $.msg.replace(cmdRegex, ''),
                    };
                }

                return null;
            })
            .filter(e => e); // eslint-disable-line @typescript-eslint/explicit-function-return-type

        if (handlerObjs.length > 0) {
            const { handler, msg } = handlerObjs[0];

            $.msg = msg; // eslint-disable-line no-param-reassign
            await handler.handler($);
            return true;
        }

        return false;
    }

    /**
     * Tries to handle the message in the given `Context`
     * with a regex handler.
     *
     * @return was the message handled?
     */
    private async tryHandleRegex($: Context): Promise<boolean> {
        const handlers = this.regexHandlers.filter((potentialHandler): boolean =>
            potentialHandler.regex.test($.msg),
        );

        if (handlers.length > 0) {
            await handlers[0].handler($);
            return true;
        }

        return false;
    }

    /**
     * Generates the help message.
     */
    private generateHelpMessage(): void {
        let helpMessage = '\n';

        this.commandHandlers.forEach((handler): void => {
            let helpEntry = '';

            helpEntry += this.cmdPrefix;
            helpEntry += handler.command;

            if (handler.description) {
                helpEntry += ' - ';
                helpEntry += handler.description;
            }

            helpMessage += `${helpEntry}\n`;
        });

        this.helpMessage = helpMessage;
    }

    /**
     * Returns handler counts, except `message_new` event since it is built-in.
     */
    public getHandlerCounts(): {
        evt: number;
        cmd: number;
        reg: number;
        pld: number;
    } {
        return {
            // Does not count `message_new` event
            evt: Object.values(this.eventHandlers).filter(e => e).length - 1, // eslint-disable-line @typescript-eslint/explicit-function-return-type
            cmd: this.commandHandlers.length,
            reg: this.regexHandlers.length,
            pld: Object.keys(this.exactPayloadHandlers).length + this.dynPayloadHandlers.length,
        }
    }
}

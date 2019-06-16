import { log } from '../extra/log';
import API from './api';
import { Keyboard } from './keyboard';

/**
 * Context, which is passed to every handler.
 */
export default class Context {
    /**
     * API.
     */
    public readonly api: API;

    /**
     * Full object passed by Callback API.
     *
     * **Note:** If `message_new`, `message_reply`, `message_edit` or `no_match` event,
     * this is a [Private message object](https://vk.com/dev/objects/message).
     * Else, see [Callback API docs](https://vk.com/dev/callback_api) or
     * [Groups Events docs](https://vk.com/dev/groups_events) for more information.
     */
    public readonly obj: any; // eslint-disable-line @typescript-eslint/no-explicit-any

    /**
     * Incoming user message.
     *
     * **Note:** If `cmd()` handler, contains message without `cmd_prefix` and the command
     */
    public msg: string; // TODO: Should be readonly

    /**
     * Name of the event.
     */
    public readonly eventType: string;

    /**
     * Does this `Context`'s response need auto-sending?
     */
    private autoSend: boolean = true;

    /**
     * The ID of a peer, to which the reply is going to be sent
     *
     * **Note:** You can change this using [[setPid]] method,
     * the original Peer ID is available in one of `$.obj.{peer_id, from_id, user_id}`.
     */
    private pid: string;

    /**
     * Text, which will be used in the reply
     */
    private replyText: string;

    /**
     * Attachments, which will be used in the reply
     */
    private attachment: string[];

    /**
     * Object of the [[Keyboard]], which will be used in the reply
     */
    private kbdObject: string;

    /**
     * @param api the API object
     * @param eventType the event type
     * @param object full object from Callback API
     * @param message the message
     */
    public constructor(api: API, eventType: string, object: object, message: string) {
        this.api = api;
        this.obj = object;
        this.msg = message;
        this.eventType = eventType;
        this.clear();
    }

    /**
     * Prevents this handler from sending the message automatically after it finishes.
     */
    public noAutoSend(): void {
        this.autoSend = false;
    }

    /**
     * Does this `Context`'s response need auto-sending?
     */
    public needsAutoSend(): boolean {
        return this.autoSend;
    }

    /**
     * Sets a new peer ID.
     *
     * @param pid new peer ID
     */
    public setPid(pid: string | number): void {
        this.pid = pid.toString();
    }

    /**
     * Sets the reply message text.
     *
     * @param txt new text
     */
    public text(txt: string): void {
        this.replyText = txt;
    }

    /**
     * Adds an attachment to the message.
     *
     * **Note:** More information on the parameters can be found in
     * [VK API docs](https://vk.com/dev/messages.send).
     *
     * @param type the type of attachment
     * @param ownerId resource owner ID
     * @param resId resource ID
     * @param accessKey resource access key, if needed;
     * see [Access Key](https://vk.com/dev/access_key) page in API docs for more information
     */
    public attach(
        type: string,
        ownerId: string | number,
        resId: string | number,
        accessKey?: string,
    ): void {
        if (accessKey) {
            this.attachment.push(`${type}${ownerId}_${resId}_${accessKey}`);
        } else {
            this.attachment.push(`${type}${ownerId}_${resId}`);
        }
    }

    /**
     * Attaches a keyboard.
     *
     * @param kbd the keyboard
     *
     * @example
     * ```
     * const { Color, Keyboard, button } = vk.kbd;
     *
     * core.cmd('keyboard', $ => {
     *     // Set 'true' instead of 'false' to make it disappear after a button was pressed
     *     var kbd = new Keyboard([
     *         // Rows
     *         [
     *             button.text('Default'),
     *             button.text('Primary', Color.Primary),
     *             button.text('Negative', Color.Negative),
     *             button.text('Positive', Color.Positive)
     *         ],
     *         [
     *             button.text('Maximum rows is 10, columns - 4.')
     *         ],
     *    ], false);
     *
     *    $.text('Here is your keyboard, as promised.');
     *    $.keyboard(kbd);
     * }, 'demo keyboard');
     * ```
     */
    public keyboard(kbd: Keyboard): void {
        this.kbdObject = JSON.stringify(kbd);
    }

    /**
     * Attaches an empty keyboard.
     */
    public removeKeyboard(): void {
        this.keyboard(new Keyboard());
    }

    /**
     * Sends the composed message to user.
     * **Note:** After the handler finishes its work, this method is called automatically
     * (if [[noAutoSend]] was not called)
     */
    public async send(): Promise<void> {
        if (this.eventType === 'message_deny') {
            log()
                .w(`No message was sent to peer ${this.pid} ("message_deny" event)`)
                .from('ctx')
                .now();
            return;
        }

        if (this.replyText === '' && this.attachment === []) {
            log()
                .w(`No message was sent to peer ${this.pid} (text or attachment is required)`)
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
     * For example, after calling this you can compose another message to the same user.
     */
    public clear(): void {
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

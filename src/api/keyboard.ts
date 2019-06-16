import { Payload } from "../core";

/**
 * See full keyboard example in [[Context.keyboard]].
 */
export class Keyboard {
    /**
     * Is this keyboard one-time?
     */
    // tslint:disable-next-line: variable-name
    public readonly one_time: boolean;

    /**
     * Items of this keyboard.
     */
    public readonly buttons: Button[][];

    /**
     * Creates a new [[Keyboard]].
     * @param buttons array of arrays (rows) of buttons
     * @param oneTime show only once? (or disappear after button press?)
     *
     * @example
     * ```
     * var kbd = new Keyboard([
     *    // One row
     *    [
     *      button.text('Maximum rows is 10, columns - 4.')
     *    ],
     * ]);
     * ```
     */
    public constructor(buttons: Button[][] = [], oneTime: boolean = false) {
        this.one_time = oneTime; // eslint-disable-line @typescript-eslint/camelcase
        this.buttons = buttons;
    }
}

/**
 * Colors of buttons in a keyboard.
 */
export enum Color {
    Primary = 'primary',
    Secondary = 'secondary',
    Negative = 'negative',
    Positive = 'positive',
}

type Button = TextButton | LocationButton | VKPayButton | OpenAppButton;

/**
 * Text-sending button.
 */
interface TextButton {
    action: {
        type: string;
        label: string;
        payload?: string;
    };
    color: Color;
}

/**
 * Location-sending button.
 */
interface LocationButton {
    action: {
        type: string;
        payload?: string;
    };
}

/**
 * VK Pay payment button.
 */
interface VKPayButton {
    action: {
        type: string;
        hash: string;
    };
}

/**
 * App-opening button.
 */
interface OpenAppButton {
    action: {
        type: string;
        app_id: number;
        label: string;
        hash: string;
        owner_id?: number;
    };
}

export const button = {
    /**
     * Creates a text-sending button.
     *
     * @param label button label
     * @param color button color
     * @param payload button payload, see [VK bots docs](https://vk.com/dev/bots_docs_3)
     * **->** Section **4.3** for more details
     *
     * @example
     * ```
     * button.text('Secondary');
     * button.text('Secondary', colors.secondary);
     * button.text('Secondary', colors.secondary, {a: 'b'});
     *
     * button.text('Primary', colors.primary);
     * button.text('Negative', colors.negative);
     * button.text('Positive', colors.positive);
     * ```
     */
    text(
        label: string = 'Button',
        color: Color = Color.Secondary,
        payload: Payload = '',
    ): TextButton {
        const btn: TextButton = {
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
     * Creates a location-sending button.
     *
     * @param payload button payload, see [VK bots docs](https://vk.com/dev/bots_docs_3)
     * **->** Section **4.3** for more details
     *
     * @example
     * ```
     * button.location({a: 'b'})
     * ```
     */
    location(payload: Payload = ''): LocationButton {
        const btn: LocationButton = {
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
     * Creates a VK Pay payment button.
     *
     * @param hash VK Pay parameters and app id in parameter `aid`, delimited by `&`,
     * see [VK Pay actions](https://vk.com/dev/vk_pay_actions)
     *
     * @example
     * ```
     * button.vkPay('action=transfer-to-group&group_id=1&aid=10')
     * ```
     */
    vkPay(hash: string): VKPayButton {
        const btn = {
            action: {
                type: 'vkpay',
                hash,
            },
        };

        return btn;
    },

    /**
     * Creates an app-opening button.
     *
     * @param appId Application ID
     * @param ownerId Group ID, if app needs to be opened in group context
     * @param label Button label
     * @param hash Parameters for app navigation
     *
     * @example
     * ```
     * button.openApp(1, 1, 'My App', 'test')
     * ```
     */
    openApp(
        appId: number,
        ownerId: number = null,
        label: string,
        hash: string,
    ): OpenAppButton {
        const btn: OpenAppButton = {
            action: {
                type: 'open_app',
                app_id: appId, // eslint-disable-line @typescript-eslint/camelcase
                label,
                hash,
            },
        };

        if (ownerId) {
            btn.action.owner_id = ownerId; // eslint-disable-line @typescript-eslint/camelcase
        }

        return btn;
    },
};

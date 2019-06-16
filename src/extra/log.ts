import chalk from 'chalk';

/**
 * Types of log messages.
 */
export enum MessageType {
    Information = 0,
    Warning = 1,
    Error = 2,
    Response = 3,
}

/**
 * Spacing of the message source.
 */
const SRC_SPACING = 5;

class LogMessageBuilder {
    /**
     * The source of the message.
     */
    public messageFrom: string = 'log';

    /**
     * The type of the message.
     */
    public messageType: MessageType = MessageType.Information;

    /**
     * The text of the message.
     */
    public messageText: string = '';

    /**
     * Sets the source of the message.
     */
    public from(f: string): LogMessageBuilder {
        this.messageFrom = f;
        return this;
    }

    /**
     * Sets the type of the message.
     */
    public type(t: MessageType): LogMessageBuilder {
        this.messageType = t;
        return this;
    }

    /**
     * Sets the text of the message.
     */
    public text(t: string | Error): LogMessageBuilder {
        if (t instanceof Error) {
            this.messageText = t.message;
        } else {
            this.messageText = t;
        }

        return this;
    }

    /**
     * Logs the message now.
     */
    public now(): LogMessageBuilder {
        this.log();
        return this;
    }

    /**
     * Logs the message.
     */
    public log(): void {
        if (this.messageText === '') {
            return;
        }

        const messageTypeString = [
            chalk.blue('info'),
            chalk.bold.yellow('warn'),
            chalk.bold.red('err!'),
            chalk.green('resp'),
        ][this.messageType];

        let spacing = '';
        for (let i = 0; i < SRC_SPACING - this.messageFrom.length; i += 1) {
            spacing += ' ';
        }

        const message = `${spacing}${this.messageFrom} ${messageTypeString} ${this.messageText}`;

        if (this.messageType === MessageType.Error) {
            throw new Error(message);
        } else {
            console.log(message); // eslint-disable-line no-console
        }
    }

    /**
     * Convenience method for logging information.
     * Sets the type to {@link types.message} and also the text of the message.
     * @param t the text of the message. If passed an `Error`,
     * the `message` property of the error will be used.
     */
    public i(t: string | Error): LogMessageBuilder {
        this.type(MessageType.Information);
        return this.text(t);
    }

    /**
     * Convenience method for logging warnings.
     * Sets the type to {@link types.warning} and also the text of the message.
     * @param t the text of the message. If passed an `Error`,
     * the `message` property of the error will be used.
     */
    public w(t: string | Error): LogMessageBuilder {
        this.type(MessageType.Warning);
        return this.text(t);
    }

    /**
     * Convenience method for logging errors.
     * Sets the type to {@link types.error} and also the text of the message.
     * @param t the text of the message. If passed an `Error`,
     * the `message` property of the error will be used.
     */
    public e(t: string | Error): LogMessageBuilder {
        this.type(MessageType.Error);
        return this.text(t);
    }

    /**
     * Convenience method for logging responses.
     * Sets the type to {@link types.response} and also the text of the message.
     * @param t the text of the message. If passed an `Error`,
     * the `message` property of the error will be used.
     */
    public r(t: string | Error): LogMessageBuilder {
        this.type(MessageType.Response);
        return this.text(t);
    }
}

/**
 * Shortcut for `new LogMessageBuilder()`.
 */
export function log(): LogMessageBuilder {
    return new LogMessageBuilder();
}

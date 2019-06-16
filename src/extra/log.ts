import chalk from 'chalk';
import * as t from 'io-ts'
import { reporter } from 'io-ts-reporters';

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
            chalk.bold.blue('info'),
            chalk.bold.keyword('orange')('warn'),
            chalk.bold.red('err!'),
            chalk.bold.green('resp'),
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
     * Sets the type to [[MessageType.Information]] and also the text of the message.
     * @param t the text of the message. If passed an `Error`,
     * the `message` property of the error will be used.
     */
    public i(t: string | Error): LogMessageBuilder {
        this.type(MessageType.Information);
        return this.text(t);
    }

    /**
     * Convenience method for logging warnings.
     * Sets the type to [[MessageType.Warning]] and also the text of the message.
     * @param t the text of the message. If passed an `Error`,
     * the `message` property of the error will be used.
     */
    public w(t: string | Error): LogMessageBuilder {
        this.type(MessageType.Warning);
        return this.text(t);
    }

    /**
     * Convenience method for logging errors.
     * Sets the type to [[MessageType.Error]] and also the text of the message.
     * @param t the text of the message. If passed an `Error`,
     * the `message` property of the error will be used.
     */
    public e(t: string | Error): LogMessageBuilder {
        this.type(MessageType.Error);
        return this.text(t);
    }

    /**
     * Convenience method for logging responses.
     * Sets the type to [[MessageType.Response]] and also the text of the message.
     * @param t the text of the message. If passed an `Error`,
     * the `message` property of the error will be used.
     */
    public r(t: string | Error): LogMessageBuilder {
        this.type(MessageType.Response);
        return this.text(t);
    }
}

/**
 * Shortcut for constructing [[LogMessageBuilder]]s.
 */
export function log(): LogMessageBuilder {
    return new LogMessageBuilder();
}

/**
 * Validates using `io-ts` and converts report from the `io-ts-reporters`
 * reporter to colorful format and joins lines with `.0` and `.1` using `or`.
 */
export function validate<A, O, I>(validator: t.Type<A, O, I>, data: any, location: string): any { // eslint-disable-line @typescript-eslint/no-explicit-any
    const result = validator.decode(data);
    const report = reporter(result);

    if (result.isLeft()) {
        report.unshift('The following errors occured during validation in `' + location + '`:');

        let newReport = report.join('\n             ');
        let regex = /Expecting (\w+) at (\w+)\.0 but instead got: (.+)\.\n *Expecting (\w+) at \w+\.1 but instead got: (.+)\./g;
        newReport = newReport.replace(regex, chalk`Expecting {bold.blue $1} or {bold.blue $4} at {bold.green $2} but instead got {bold.red $3}`);

        regex = /Expecting (\w+) at (\w+) but instead got: (.+)\./g;
        newReport = newReport.replace(regex, chalk`Expecting {bold.blue $1} at {bold.green $2} but instead got {bold.red $3}`);

        log().e(newReport).from('•_•').now();

        return null;
    } else {
        return result.value;
    }
}

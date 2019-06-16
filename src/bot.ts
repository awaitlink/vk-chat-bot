import Core from './core';
import { log } from './extra/log';

import bodyParser from 'body-parser';
import express, { Request, Response } from 'express';

/**
 * The [[Bot]] class responds to incoming events from Callback API,
 * and figures out what needs to be done.
 */
export default class Bot {
    /**
     * Core.
     */
    private core: Core;
    /**
     * Group ID.
     */
    private groupId: string;
    /**
     * Confirmation token.
     */
    private confirmationToken: string;
    /**
     * Secret.
     */
    private secret: string;
    /**
     * Port.
     */
    private port: number;

    /**
     * Creates a new [[Bot]].
     * @param core - a [[Core]] object
     * @param groupId - group ID from Callback API settings
     * @param confirmationToken - confirmation token from Callback API settings
     * @param secret - secret key (can be set in Callback API settings)
     * @param port - the port bot will run at
     */
    public constructor(
        core: Core,
        groupId: string,
        confirmationToken: string,
        secret: string,
        port: number,
    ) {
        this.core = core;
        this.groupId = groupId;
        this.confirmationToken = confirmationToken;
        this.secret = secret;
        this.port = port;
    }

    /**
     * Starts the bot.
     */
    public start(): void {
        this.core.lock();
        const { evt, cmd, reg, pld } = this.core.getHandlerCounts();

        log()
            .i(`Handlers count: on:${evt} cmd:${cmd} regex:${reg} payload:${pld}`)
            .from('bot')
            .now();

        if (evt + cmd + reg + pld === 0) {
            log()
                .w("The bot won't do anything without handlers!")
                .from('bot')
                .now();
        }

        log()
            .i('Preparing and starting the server...')
            .from('bot')
            .now();

        const app = express();

        app.use(bodyParser.json());

        app.get(
            '/',
            (
                _req: Request,
                res: Response,
            ): void => {
                res.status(400).send('Only POST allowed.');
                log()
                    .w('Received a GET request')
                    .from('bot')
                    .now();
            },
        );

        app.post(
            '/',
            (
                req: Request,
                res: Response,
            ): void => {
                const { body } = req;

                if (body.secret !== this.secret) {
                    res.status(400).send('Invalid secret key.');
                    log()
                        .w('Received a request with an invalid secret key')
                        .from('bot')
                        .now();
                    return;
                }

                if (body.group_id.toString() !== this.groupId) {
                    res.status(400).send('Invalid group id.');
                    log()
                        .w('Received a request with an invalid group id')
                        .from('bot')
                        .now();
                    return;
                }

                if (body.type === 'confirmation') {
                    res.status(200).send(this.confirmationToken);
                    log()
                        .r('Sent confirmation token.')
                        .from('bot')
                        .now();
                } else {
                    res.status(200).send('ok');
                    this.core.parseRequest(body);
                }
            },
        );

        app.listen(this.port, (err: Error): void => {
            if (err) {
                log()
                    .e(`Error occured while starting the server: ${err}`)
                    .from('bot')
                    .now();
            }

            log()
                .i(`Server is listening on port ${this.port}`)
                .from('bot')
                .now();
        });
    }
}

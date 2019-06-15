import Core from './core';
import { log } from './extra/log';

import bodyParser from 'body-parser';
import express from 'express';

export default class Bot {
  /**
   * Core.
   */
  private core: any;
  /**
   * Group ID.
   */
  private groupId: any;
  /**
   * Confirmation token.
   */
  private confirmationToken: any;
  /**
   * Secret.
   */
  private secret: any;
  /**
   * Port.
   */
  private port: any;

  /**
   * The `Bot` class responds to incoming events from Callback API,
   * and figures out what needs to be done.
   *
   * @param core - a `Core` object
   * @param groupId - group ID from Callback API settings
   * @param confirmationToken - confirmation token from Callback API settings
   * @param secret - secret key (can be set in Callback API settings)
   * @param port - the port bot will run at
   */
  constructor(
    core: Core,
    groupId: string | number,
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
  public start() {
    this.core.lock();

    // Does not count `message_new` event
    const evt =
      Object.values(this.core.eventHandlers).filter(e => e).length - 1;
    const pld =
      Object.keys(this.core.exactPayloadHandlers).length +
      this.core.dynPayloadHandlers.length;
    const cmd = this.core.commandHandlers.length;
    const reg = this.core.regexHandlers.length;
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
        req: any,
        res: { status: (arg0: number) => { send: (arg0: string) => void } },
      ) => {
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
        req: { body: any },
        res: {
          status: {
            (arg0: number): { send: (arg0: string) => void };
            (arg0: number): { send: (arg0: string) => void };
            (arg0: number): { send: (arg0: any) => void };
            (arg0: number): { send: (arg0: string) => void };
          };
        },
      ) => {
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

    const server = app.listen(this.port, (err: any) => {
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

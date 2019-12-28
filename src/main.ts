import chalk from 'chalk';
import Bot from './bot';
import Core from './core';

import API from './api/api';
import Context from './api/context';
import * as kbd from './api/keyboard';

import * as log from './extra/log';
import Stats from './extra/stats';

import * as t from 'io-ts'

process.on('uncaughtException', (err): void => {
    const note = chalk.inverse(`• An error occured. The messages below may contain useful information about the problem.
• If you think this is an issue with 'vk-chat-bot' itself, please report it at <https://github.com/u32i64/vk-chat-bot/issues>.`);

    /* eslint-disable no-console */
    console.log(`\n\n${note}\n\n`);
    console.log(err);
    /* eslint-enable no-console */

    process.exit(1);
});

/**
 * Creates all the necessary objects for the bot and the [[Bot]] object itself.
 *
 * @example
 * ```
 * var params = {
 *    vkToken: 'your_vk_access_token',
 *    confirmationToken: 'f123456',
 *    groupId: 1234567,
 *    secret: 's3r10us1y_s3cr3t_phr4s3',
 *    port: 12345,
 *
 *    cmdPrefix: '/'
 *  };
 *
 * var {bot, core} = vk.bot(params);
 * ```
 */
function bot(options: {
    vkToken: string;
    confirmationToken: string;
    groupId: string | number;
    secret: string;
    port: string | number;
    cmdPrefix: string;
}): { bot: Bot; core: Core } {

    const result = log.validate(t.type({
        vkToken: t.string,
        confirmationToken: t.string,
        groupId: t.union([t.string, t.number]),
        secret: t.string,
        port: t.union([t.string, t.number]),
        cmdPrefix: t.string,
    }), options, 'bot');

    const {
        vkToken,
        confirmationToken,
        groupId,
        secret,
        port,
        cmdPrefix
    } = result;

    const stats = new Stats();
    const api = new API(vkToken, stats);
    const core = new Core(api, stats, cmdPrefix, groupId.toString());
    const _port = typeof port === 'number' ? port : parseInt(port);

    return {
        bot: new Bot(
            core,
            groupId.toString(),
            confirmationToken.toString(),
            secret.toString(),
            _port,
        ),
        core,
    };
}

/**
 * The exported object. Use it to get what you need.
 */
const vk = {
    // Quick creation function
    bot,

    // src/
    Bot,
    Core,

    // src/api/
    API,
    Context,
    kbd,

    // src/extra/
    log,
    Stats,
};

export default vk; // for .d.ts generation
module.exports = vk; // for package to work correctly

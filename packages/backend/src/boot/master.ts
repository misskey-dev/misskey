/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import cluster from 'node:cluster';
import { fileURLToPath } from 'node:url';
import * as os from 'node:os';
import { dirname } from 'node:path';
import * as fs from 'node:fs';
import chalk from 'chalk';
import chalkTemplate from 'chalk-template';
import { WorkerArguments } from '@/boot/const.js';
import { sentryInit } from '@/boot/sentry.js';
import { computeWorkerArguments } from '@/boot/worker.js';
import type { Config } from '@/config.js';
import { loadConfig } from '@/config.js';
import { envOption } from '@/env.js';
import Logger from '@/logger.js';
import { showMachineInfo } from '@/misc/show-machine-info.js';
import { isHttpServerOnPrimary, jobQueue, server } from './common.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const meta = JSON.parse(fs.readFileSync(`${_dirname}/../../../../built/meta.json`, 'utf-8'));

const logger = new Logger('core', 'cyan');
const bootLogger = logger.createSubLogger('boot', 'magenta');

const themeColor = chalk.hex('#86b300');

function greet() {
	if (!envOption.quiet) {
		//#region Misskey logo
		const v = `v${meta.version}`;
		console.log(themeColor('  _____ _         _           '));
		console.log(themeColor(' |     |_|___ ___| |_ ___ _ _ '));
		console.log(themeColor(' | | | | |_ -|_ -| \'_| -_| | |'));
		console.log(themeColor(' |_|_|_|_|___|___|_,_|___|_  |'));
		console.log(' ' + chalk.gray(v) + themeColor('                        |___|\n'.substring(v.length)));
		//#endregion

		console.log(' Misskey is an open-source decentralized microblogging platform.');
		console.log(chalk.rgb(255, 136, 0)(' If you like Misskey, please donate to support development. https://www.patreon.com/syuilo'));

		console.log('');
		console.log(chalkTemplate`--- ${os.hostname()} {gray (PID: ${process.pid.toString()})} ---`);
	}

	bootLogger.info('Welcome to Misskey!');
	bootLogger.info(`Misskey v${meta.version}`, null, true);
}

/**
 * Init master process
 */
export async function masterMain() {
	let config!: Config;

	// initialize app
	try {
		greet();
		showEnvironment();
		await showMachineInfo(bootLogger);
		showNodejsVersion();
		config = loadConfigBoot();
		//await connectDb();
		if (config.pidFile) fs.writeFileSync(config.pidFile, process.pid.toString());
	} catch (e) {
		bootLogger.error('Fatal error occurred during initialization', null, true);
		process.exit(1);
	}

	bootLogger.succ('Misskey initialized');

	sentryInit(config);

	bootLogger.info(
		`mode: [disableClustering: ${envOption.disableClustering}, onlyServer: ${envOption.onlyServer}, onlyQueue: ${envOption.onlyQueue}]`,
	);

	if (!envOption.disableClustering) {
		// clusterモジュール有効時

		if (envOption.onlyServer || !isHttpServerOnPrimary(config)) {
			// このブロックに入る場合はワーカープロセス側でのlistenが必要になると判断されているため、メインプロセスはforkのみに制限する(listenしない)。
			// ワーカープロセス側でlistenすると、メインプロセスでポートへの着信を受け入れてワーカープロセスへの分配を行う動作をする。
			// そのため、メインプロセスでも直接listenするとポートの競合が発生して起動に失敗してしまう。
			// see: https://nodejs.org/api/cluster.html#cluster
		} else if (envOption.onlyQueue) {
			await jobQueue();
		} else {
			await server();
		}

		await spawnWorkers(config);
	} else {
		// clusterモジュール無効時

		if (envOption.onlyServer) {
			await server();
		} else if (envOption.onlyQueue) {
			await jobQueue();
		} else {
			await server();
			await jobQueue();
		}
	}

	if (envOption.onlyQueue) {
		bootLogger.succ('Queue started', null, true);
	} else {
		bootLogger.succ(config.socket ? `Now listening on socket ${config.socket} on ${config.url}` : `Now listening on port ${config.port} on ${config.url}`, null, true);
	}
}

function showEnvironment(): void {
	const env = process.env.NODE_ENV;
	const logger = bootLogger.createSubLogger('env');
	logger.info(typeof env === 'undefined' ? 'NODE_ENV is not set' : `NODE_ENV: ${env}`);

	if (env !== 'production') {
		logger.warn('The environment is not in production mode.');
		logger.warn('DO NOT USE FOR PRODUCTION PURPOSE!', null, true);
	}
}

function showNodejsVersion(): void {
	const nodejsLogger = bootLogger.createSubLogger('nodejs');

	nodejsLogger.info(`Version ${process.version} detected.`);
}

function loadConfigBoot(): Config {
	const configLogger = bootLogger.createSubLogger('config');
	let config;

	try {
		config = loadConfig();
	} catch (exception) {
		if (typeof exception === 'string') {
			configLogger.error(exception);
			process.exit(1);
		} else if ((exception as any).code === 'ENOENT') {
			configLogger.error('Configuration file not found', null, true);
			process.exit(1);
		}
		throw exception;
	}

	configLogger.succ('Loaded');

	return config;
}

/*
async function connectDb(): Promise<void> {
	const dbLogger = bootLogger.createSubLogger('db');

	// Try to connect to DB
	try {
		dbLogger.info('Connecting...');
		await initDb();
		const v = await db.query('SHOW server_version').then(x => x[0].server_version);
		dbLogger.succ(`Connected: v${v}`);
	} catch (err) {
		dbLogger.error('Cannot connect', null, true);
		dbLogger.error(err);
		process.exit(1);
	}
}
*/

async function spawnWorkers(config: Config) {
	const workerArgs = computeWorkerArguments(config, envOption);
	bootLogger.info(`Starting ${workerArgs.length} worker${workerArgs.length === 1 ? '' : 's'}...`);

	await Promise.all(
		workerArgs.map(it => spawnWorker(it)),
	);

	bootLogger.succ('All workers started');
}

function spawnWorker(env: WorkerArguments): Promise<void> {
	return new Promise(res => {
		const worker = cluster.fork(env);
		worker.on('message', message => {
			if (message === 'listenFailed') {
				bootLogger.error('The server Listen failed due to the previous error.');
				process.exit(1);
			}
			if (message !== 'ready') return;
			res();
		});
	});
}

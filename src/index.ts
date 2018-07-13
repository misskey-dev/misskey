/**
 * Misskey Entry Point!
 */

Error.stackTraceLimit = Infinity;

import * as os from 'os';
import * as cluster from 'cluster';
import * as debug from 'debug';
import chalk from 'chalk';
import * as portscanner from 'portscanner';
import isRoot = require('is-root');
import Xev from 'xev';

import Logger from './misc/logger';
import ProgressBar from './misc/cli/progressbar';
import EnvironmentInfo from './misc/environmentInfo';
import MachineInfo from './misc/machineInfo';
import DependencyInfo from './misc/dependencyInfo';
import serverStats from './daemons/server-stats';
import notesStats from './daemons/notes-stats';
import db from './db/mongodb';
import loadConfig from './config/load';
import { Config } from './config/types';

const clusterLog = debug('misskey:cluster');
const ev = new Xev();

process.title = 'Misskey';

if (process.env.NODE_ENV != 'production') {
	process.env.DEBUG = 'misskey:*';
}

// https://github.com/Automattic/kue/issues/822
require('events').EventEmitter.prototype._maxListeners = 512;

// Start app
main();

/**
 * Init process
 */
function main() {
	if (cluster.isMaster) {
		masterMain();

		ev.mount();
		serverStats();
		notesStats();
	} else {
		workerMain();
	}
}

/**
 * Init master process
 */
async function masterMain() {
	let config: Config;

	try {
		// initialize app
		config = await init();
	} catch (e) {
		console.error(e);
		Logger.error(chalk.red('Fatal error occurred during initializing :('));
		process.exit(1);
	}

	Logger.info(chalk.green('Successfully initialized :)'));

	spawnWorkers(() => {
		Logger.info(chalk.bold.green(
			`Now listening on port ${chalk.underline(config.port.toString())}`));

		Logger.info(chalk.bold.green(config.url));

		Logger.info(chalk.bold.green('Now processing jobs'));
	});
}

/**
 * Init worker process
 */
async function workerMain() {
	// start server
	await require('./server').default();

	// start processor
	require('./queue').default();

	// Send a 'ready' message to parent process
	process.send('ready');
}

/**
 * Init app
 */
async function init(): Promise<Config> {
	Logger.info('Welcome to Misskey!');
	Logger.info('Initializing...');

	EnvironmentInfo.show();
	MachineInfo.show();
	new DependencyInfo().showAll();

	const configLogger = new Logger('Config');
	let config;

	try {
		config = loadConfig();
	} catch (exception) {
		if (exception.code === 'ENOENT') {
			throw 'Configuration not found - Please run "npm run config" command.';
		}

		throw exception;
	}

	configLogger.info('Successfully loaded');
	configLogger.info(`Maintainer: ${config.maintainer.name}`);

	if (process.platform === 'linux' && !isRoot() && config.port < 1024) {
		Logger.error('You need root privileges to listen on port below 1024 on Linux');
		process.exit(1);
	}

	if (await portscanner.checkPortStatus(config.port, '127.0.0.1') === 'open') {
		Logger.error(`Port ${config.port} is already in use`);
		process.exit(1);
	}

	// Try to connect to MongoDB
	const mongoDBLogger = new Logger('MongoDB');
	const db = require('./db/mongodb').default;
	mongoDBLogger.info('Successfully connected');
	db.close();

	return config;
}

function spawnWorkers(onComplete: Function) {
	// Count the machine's CPUs
	const cpuCount = os.cpus().length;

	const progress = new ProgressBar(cpuCount, 'Starting workers');

	// Create a worker for each CPU
	for (let i = 0; i < cpuCount; i++) {
		const worker = cluster.fork();
		worker.on('message', message => {
			if (message === 'ready') {
				progress.increment();
			}
		});
	}

	// On all workers started
	progress.on('complete', () => {
		onComplete();
	});
}

// Listen new workers
cluster.on('fork', worker => {
	clusterLog(`Process forked: [${worker.id}]`);
});

// Listen online workers
cluster.on('online', worker => {
	clusterLog(`Process is now online: [${worker.id}]`);
});

// Listen for dying workers
cluster.on('exit', worker => {
	// Replace the dead worker,
	// we're not sentimental
	clusterLog(chalk.red(`[${worker.id}] died :(`));
	cluster.fork();
});

// Display detail of unhandled promise rejection
process.on('unhandledRejection', console.dir);

// Display detail of uncaught exception
process.on('uncaughtException', err => {
	console.error(err);
});

// Dying away...
process.on('exit', code => {
	Logger.info(`The process is going exit with code ${code}`);

	db.close();
});

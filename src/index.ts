/**
 * Misskey Entry Point!
 */

Error.stackTraceLimit = Infinity;

require('events').EventEmitter.defaultMaxListeners = 128;

import * as os from 'os';
import * as cluster from 'cluster';
import chalk from 'chalk';
import * as portscanner from 'portscanner';
import * as isRoot from 'is-root';
import Xev from 'xev';

import Logger from './services/logger';
import serverStats from './daemons/server-stats';
import notesStats from './daemons/notes-stats';
import loadConfig from './config/load';
import { Config } from './config/types';
import { lessThan } from './prelude/array';
import * as pkg from '../package.json';
import { program } from './argv';
import { checkMongoDB } from './misc/check-mongodb';
import { showMachineInfo } from './misc/show-machine-info';

const logger = new Logger('core', 'cyan');
const bootLogger = logger.createSubLogger('boot', 'magenta', false);
const clusterLogger = logger.createSubLogger('cluster', 'orange');
const ev = new Xev();

/**
 * Init process
 */
function main() {
	process.title = `Misskey (${cluster.isMaster ? 'master' : 'worker'})`;

	if (program.onlyQueue) {
		queueMain();
		return;
	}

	if (cluster.isMaster || program.disableClustering) {
		masterMain();

		if (cluster.isMaster) {
			ev.mount();
		}

		if (program.daemons) {
			serverStats();
			notesStats();
		}
	}

	if (cluster.isWorker || program.disableClustering) {
		workerMain();
	}
}

function greet() {
	if (!program.quiet) {
		//#region Misskey logo
		const v = `v${pkg.version}`;
		console.log('  _____ _         _           ');
		console.log(' |     |_|___ ___| |_ ___ _ _ ');
		console.log(' | | | | |_ -|_ -| \'_| -_| | |');
		console.log(' |_|_|_|_|___|___|_,_|___|_  |');
		console.log(' ' + chalk.gray(v) + ('                        |___|\n'.substr(v.length)));
		//#endregion

		console.log(' Misskey is maintained by @syuilo, @AyaMorisawa, @mei23, and @acid-chicken.');
		console.log(chalk.keyword('orange')(' If you like Misskey, please donate to support development. https://www.patreon.com/syuilo'));

		console.log('');
		console.log(chalk`<${os.hostname()} {gray (PID: ${process.pid.toString()})}>`);
	}

	bootLogger.info('Welcome to Misskey!');
	bootLogger.info(`Misskey v${pkg.version}`, null, true);
}

/**
 * Init master process
 */
async function masterMain() {
	greet();

	let config: Config;

	try {
		// initialize app
		config = await init();

		if (config.port == null) {
			bootLogger.error('The port is not configured. Please configure port.', null, true);
			process.exit(1);
		}

		if (process.platform === 'linux' && isWellKnownPort(config.port) && !isRoot()) {
			bootLogger.error('You need root privileges to listen on well-known port on Linux', null, true);
			process.exit(1);
		}

		if (!await isPortAvailable(config.port)) {
			bootLogger.error(`Port ${config.port} is already in use`, null, true);
			process.exit(1);
		}
	} catch (e) {
		bootLogger.error('Fatal error occurred during initialization', null, true);
		process.exit(1);
	}

	bootLogger.succ('Misskey initialized');

	if (!program.disableClustering) {
		await spawnWorkers(config.clusterLimit);
	}

	// start queue
	require('./queue').default();

	bootLogger.succ(`Now listening on port ${config.port} on ${config.url}`, null, true);
}

/**
 * Init worker process
 */
async function workerMain() {
	// start server
	await require('./server').default();

	if (cluster.isWorker) {
		// Send a 'ready' message to parent process
		process.send('ready');
	}
}

async function queueMain() {
	greet();

	try {
		// initialize app
		await init();
	} catch (e) {
		bootLogger.error('Fatal error occurred during initialization', null, true);
		process.exit(1);
	}

	bootLogger.succ('Misskey initialized');

	// start processor
	const queue = require('./queue').default();

	if (queue) {
		bootLogger.succ('Queue started', null, true);
	} else {
		bootLogger.error('Queue not available');
	}
}

const runningNodejsVersion = process.version.slice(1).split('.').map(x => parseInt(x, 10));
const requiredNodejsVersion = [10, 0, 0];
const satisfyNodejsVersion = !lessThan(runningNodejsVersion, requiredNodejsVersion);

function isWellKnownPort(port: number): boolean {
	return port < 1024;
}

async function isPortAvailable(port: number): Promise<boolean> {
	return await portscanner.checkPortStatus(port, '127.0.0.1') === 'closed';
}

function showEnvironment(): void {
	const env = process.env.NODE_ENV;
	const logger = bootLogger.createSubLogger('env');
	logger.info(typeof env == 'undefined' ? 'NODE_ENV is not set' : `NODE_ENV: ${env}`);

	if (env !== 'production') {
		logger.warn('The environment is not in production mode.');
		logger.warn('DO NOT USE FOR PRODUCTION PURPOSE!', null, true);
	}

	logger.info(`You ${isRoot() ? '' : 'do not '}have root privileges`);
}

/**
 * Init app
 */
async function init(): Promise<Config> {
	showEnvironment();

	const nodejsLogger = bootLogger.createSubLogger('nodejs');

	nodejsLogger.info(`Version ${runningNodejsVersion.join('.')}`);

	if (!satisfyNodejsVersion) {
		nodejsLogger.error(`Node.js version is less than ${requiredNodejsVersion.join('.')}. Please upgrade it.`, null, true);
		process.exit(1);
	}

	await showMachineInfo(bootLogger);

	const configLogger = bootLogger.createSubLogger('config');
	let config;

	try {
		config = loadConfig();
	} catch (exception) {
		if (typeof exception === 'string') {
			configLogger.error(exception);
			process.exit(1);
		}
		if (exception.code === 'ENOENT') {
			configLogger.error('Configuration file not found', null, true);
			process.exit(1);
		}
		throw exception;
	}

	configLogger.succ('Loaded');

	// Try to connect to MongoDB
	try {
		await checkMongoDB(config, bootLogger);
	} catch (e) {
		bootLogger.error('Cannot connect to database', null, true);
		process.exit(1);
	}

	return config;
}

async function spawnWorkers(limit: number = Infinity) {
	const workers = Math.min(limit, os.cpus().length);
	bootLogger.info(`Starting ${workers} worker${workers === 1 ? '' : 's'}...`);
	await Promise.all([...Array(workers)].map(spawnWorker));
	bootLogger.succ('All workers started');
}

function spawnWorker(): Promise<void> {
	return new Promise(res => {
		const worker = cluster.fork();
		worker.on('message', message => {
			if (message !== 'ready') return;
			res();
		});
	});
}

//#region Events

// Listen new workers
cluster.on('fork', worker => {
	clusterLogger.debug(`Process forked: [${worker.id}]`);
});

// Listen online workers
cluster.on('online', worker => {
	clusterLogger.debug(`Process is now online: [${worker.id}]`);
});

// Listen for dying workers
cluster.on('exit', worker => {
	// Replace the dead worker,
	// we're not sentimental
	clusterLogger.error(chalk.red(`[${worker.id}] died :(`));
	cluster.fork();
});

// Display detail of unhandled promise rejection
if (!program.quiet) {
	process.on('unhandledRejection', console.dir);
}

// Display detail of uncaught exception
process.on('uncaughtException', err => {
	logger.error(err);
});

// Dying away...
process.on('exit', code => {
	logger.info(`The process is going to exit with code ${code}`);
});

//#endregion

main();

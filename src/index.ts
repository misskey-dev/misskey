/**
 * Misskey Entry Point!
 */

Error.stackTraceLimit = Infinity;

require('events').EventEmitter.defaultMaxListeners = 128;

import * as os from 'os';
import * as cluster from 'cluster';
import * as debug from 'debug';
import chalk from 'chalk';
import * as portscanner from 'portscanner';
import isRoot = require('is-root');
import Xev from 'xev';
import * as program from 'commander';
import mongo from './db/mongodb';

import Logger from './misc/logger';
import ProgressBar from './misc/cli/progressbar';
import EnvironmentInfo from './misc/environmentInfo';
import MachineInfo from './misc/machineInfo';
import serverStats from './daemons/server-stats';
import notesStats from './daemons/notes-stats';
import loadConfig from './config/load';
import { Config } from './config/types';

const clusterLog = debug('misskey:cluster');
const ev = new Xev();

if (process.env.NODE_ENV != 'production' && process.env.DEBUG == null) {
	debug.enable('misskey');
}

const pkg = require('../package.json');

//#region Command line argument definitions
program
	.version(pkg.version)
	.option('--no-daemons', 'Disable daemon processes (for debbuging)')
	.option('--disable-clustering', 'Disable clustering')
	.parse(process.argv);
//#endregion

main();

/**
 * Init process
 */
function main() {
	process.title = `Misskey (${cluster.isMaster ? 'master' : 'worker'})`;

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
		Logger.error('Fatal error occurred during initialization');
		process.exit(1);
	}

	Logger.succ('Misskey initialized');

	if (!program.disableClustering) {
		await spawnWorkers(config.clusterLimit);
		Logger.succ('All workers started');
	}

	Logger.info(`Now listening on port ${config.port} on ${config.url}`);
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

/**
 * Init app
 */
async function init(): Promise<Config> {
	Logger.info('Welcome to Misskey!');
	Logger.info(`<<< Misskey v${pkg.version} >>>`);

	new Logger('Deps').info(`Node.js ${process.version}`);
	MachineInfo.show();
	EnvironmentInfo.show();

	const configLogger = new Logger('Config');
	let config;

	try {
		config = loadConfig();
	} catch (exception) {
		if (typeof exception === 'string') {
			configLogger.error(exception);
			process.exit(1);
		}
		if (exception.code === 'ENOENT') {
			configLogger.error('Configuration file not found');
			process.exit(1);
		}
		throw exception;
	}

	configLogger.succ('Loaded');

	if (process.platform === 'linux' && !isRoot() && config.port < 1024) {
		Logger.error('You need root privileges to listen on port below 1024 on Linux');
		process.exit(1);
	}

	if (await portscanner.checkPortStatus(config.port, '127.0.0.1') === 'open') {
		Logger.error(`Port ${config.port} is already in use`);
		process.exit(1);
	}

	// Try to connect to MongoDB
	checkMongoDb(config);

	return config;
}

function checkMongoDb(config: Config) {
	const mongoDBLogger = new Logger('MongoDB');
	const u = config.mongodb.user ? encodeURIComponent(config.mongodb.user) : null;
	const p = config.mongodb.pass ? encodeURIComponent(config.mongodb.pass) : null;
	const uri = `mongodb://${u && p ? `${u}:****@` : ''}${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.db}`;
	mongoDBLogger.info(`Connecting to ${uri}`);

	mongo.then(() => {
		mongoDBLogger.succ('Connectivity confirmed');
	})
	.catch(err => {
		mongoDBLogger.error(err.message);
	});
}

function spawnWorkers(limit: number) {
	return new Promise(res => {
		// Count the machine's CPUs
		const cpuCount = os.cpus().length;

		const count = limit || cpuCount;

		const progress = new ProgressBar(count, 'Starting workers');

		// Create a worker for each CPU
		for (let i = 0; i < count; i++) {
			const worker = cluster.fork();
			worker.on('message', message => {
				if (message === 'ready') {
					progress.increment();
				}
			});
		}

		// On all workers started
		progress.on('complete', () => {
			res();
		});
	});
}

//#region Events

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
	Logger.info(`The process is going to exit with code ${code}`);
});

//#endregion

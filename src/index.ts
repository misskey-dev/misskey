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
import * as program from 'commander';
import * as sysUtils from 'systeminformation';
import mongo, { nativeDbConn } from './db/mongodb';

import Logger from './misc/logger';
import serverStats from './daemons/server-stats';
import notesStats from './daemons/notes-stats';
import loadConfig from './config/load';
import { Config } from './config/types';
import { lessThan } from './prelude/array';
import * as pkg from '../package.json';

const logger = new Logger('core', 'cyan');
const bootLogger = logger.createSubLogger('boot', 'magenta');
const clusterLog = logger.createSubLogger('cluster', 'orange');
const ev = new Xev();

//#region Command line argument definitions
program
	.version(pkg.version)
	.option('--no-daemons', 'Disable daemon processes (for debbuging)')
	.option('--disable-clustering', 'Disable clustering')
	.option('--quiet', 'Suppress all logs')
	.parse(process.argv);
//#endregion

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

	if (!program.quiet) {
		//#region Misskey logo
		console.log(' _____ _         _           ');
		console.log('|     |_|___ ___| |_ ___ _ _ ');
		console.log('| | | | |_ -|_ -| \'_| -_| | |');
		console.log('|_|_|_|_|___|___|_,_|___|_  |');
		console.log('                        |___|\n');
		//#endregion
	}

	bootLogger.info('Welcome to Misskey!');
	bootLogger.info(`Misskey v${pkg.version}`, true);

	try {
		// initialize app
		config = await init();
	} catch (e) {
		bootLogger.error('Fatal error occurred during initialization', true);
		process.exit(1);
	}

	bootLogger.succ('Misskey initialized');

	if (!program.disableClustering) {
		await spawnWorkers(config.clusterLimit);
	}

	bootLogger.succ(`Now listening on port ${config.port} on ${config.url}`, true);
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

const runningNodejsVersion = process.version.slice(1).split('.').map(x => parseInt(x, 10));
const requiredNodejsVersion = [10, 0, 0];
const satisfyNodejsVersion = !lessThan(runningNodejsVersion, requiredNodejsVersion);

function isWellKnownPort(port: number): boolean {
	return port < 1024;
}

async function isPortAvailable(port: number): Promise<boolean> {
	return await portscanner.checkPortStatus(port, '127.0.0.1') === 'closed';
}

async function showMachine() {
	const logger = bootLogger.createSubLogger('machine');
	logger.info(`Hostname: ${os.hostname()}`);
	logger.info(`Platform: ${process.platform}`);
	logger.info(`Architecture: ${process.arch}`);
	logger.info(`CPU: ${os.cpus().length} core`);
	const mem = await sysUtils.mem();
	const totalmem = (mem.total / 1024 / 1024 / 1024).toFixed(1);
	const availmem = (mem.available / 1024 / 1024 / 1024).toFixed(1);
	logger.info(`MEM: ${totalmem}GB (available: ${availmem}GB)`);
}

function showEnvironment(): void {
	const env = process.env.NODE_ENV;
	const logger = bootLogger.createSubLogger('env');
	logger.info(typeof env == 'undefined' ? 'NODE_ENV is not set' : `NODE_ENV: ${env}`);

	if (env !== 'production') {
		logger.warn('The environment is not in production mode.');
		logger.warn('DO NOT USE FOR PRODUCTION PURPOSE!', true);
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
		nodejsLogger.error(`Node.js version is less than ${requiredNodejsVersion.join('.')}. Please upgrade it.`);
		process.exit(1);
	}

	await showMachine();

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
			configLogger.error('Configuration file not found');
			process.exit(1);
		}
		throw exception;
	}

	configLogger.succ('Loaded');

	if (config.port == null) {
		bootLogger.error('The port is not configured. Please configure port.');
		process.exit(1);
	}

	if (process.platform === 'linux' && isWellKnownPort(config.port) && !isRoot()) {
		bootLogger.error('You need root privileges to listen on well-known port on Linux');
		process.exit(1);
	}

	if (!await isPortAvailable(config.port)) {
		bootLogger.error(`Port ${config.port} is already in use`, true);
		process.exit(1);
	}

	// Try to connect to MongoDB
	await checkMongoDB(config);

	return config;
}

const requiredMongoDBVersion = [3, 6];

function checkMongoDB(config: Config) {
	const mongoDBLogger = bootLogger.createSubLogger('db');
	const u = config.mongodb.user ? encodeURIComponent(config.mongodb.user) : null;
	const p = config.mongodb.pass ? encodeURIComponent(config.mongodb.pass) : null;
	const uri = `mongodb://${u && p ? `${u}:****@` : ''}${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.db}`;
	mongoDBLogger.info(`Connecting to ${uri}`);

	mongo.then(() => {
		mongoDBLogger.succ('Connectivity confirmed');

		nativeDbConn().then(db => db.admin().serverInfo()).then(x => x.version).then((version: string) => {
			mongoDBLogger.info(`Version: ${version}`);
			if (lessThan(version.split('.').map(x => parseInt(x, 10)), requiredMongoDBVersion)) {
				mongoDBLogger.error(`MongoDB version is less than ${requiredMongoDBVersion.join('.')}. Please upgrade it.`);
				process.exit(1);
			}
		});
	}).catch(err => {
		mongoDBLogger.error(err.message);
	});
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
	clusterLog.info(`Process forked: [${worker.id}]`);
});

// Listen online workers
cluster.on('online', worker => {
	clusterLog.succ(`Process is now online: [${worker.id}]`);
});

// Listen for dying workers
cluster.on('exit', worker => {
	// Replace the dead worker,
	// we're not sentimental
	clusterLog.error(chalk.red(`[${worker.id}] died :(`));
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

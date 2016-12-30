/**
 * Misskey Entory Point!
 */

Error.stackTraceLimit = Infinity;

/**
 * Module dependencies
 */
import * as fs from 'fs';
import * as os from 'os';
import * as cluster from 'cluster';
const prominence = require('prominence');
import Logger from './utils/logger';
import * as chalk from 'chalk';
const git = require('git-last-commit');
const portUsed = require('tcp-port-used');
const isRoot = require('is-root');
import ProgressBar from './utils/cli/progressbar';
import initdb from './db/mongodb';
import DependencyChecker from './utils/dependencyChecker';

// Init babel
require('babel-core/register');
require('babel-polyfill');

const env = process.env.NODE_ENV;
const IS_PRODUCTION = env === 'production';
const IS_DEBUG = !IS_PRODUCTION;

global.config = require('./config').default(`${__dirname}/../.config/config.yml`);

/**
 * Initialize state
 */
enum State {
	success,
	warn,
	failed
}

// Set process title
process.title = 'Misskey';

// Start app
main();

/**
 * Init proccess
 */
function main(): void {
	// Master
	if (cluster.isMaster) {
		master();
	} else { // Workers
		worker();
	}
}

/**
 * Init master proccess
 */
async function master(): Promise<void> {
	let state: State;

	try {
		// initialize app
		state = await init();
	} catch (e) {
		console.error(e);
		process.exit(1);
	}

	switch (state) {
		case State.failed:
			Logger.error(chalk.red('Fatal error occurred during initializing :('));
			process.exit();
			return;
		case State.warn:
			Logger.warn(chalk.yellow('Initialized with some problem(s) :|'));
			break;
		case State.success:
			Logger.info(chalk.green('Successfully initialized :)'));
			break;
	}

	// Spawn workers
	spawn(() => {
		Logger.info(chalk.bold.green(`Now listening on port ${config.port}`));

		// Listen new workers
		cluster.on('fork', worker => {
			console.log(`Process forked: [${worker.id}]`);
		});

		// Listen online workers
		cluster.on('online', worker => {
			console.log(`Process is now online: [${worker.id}]`);
		});

		// Listen for dying workers
		cluster.on('exit', worker => {
			// Replace the dead worker,
			// we're not sentimental
			console.log(chalk.red(`[${worker.id}] died :(`));
			cluster.fork();
		});
	});
}

/**
 * Init worker proccess
 */
function worker(): void {
	// Register config
	global.config = config;

	// Init mongo
	initdb().then(db => {
		global.db = db;

		// start server
		require('./server');
	}, err => {
		console.error(err);
		process.exit(0);
	});
}

/**
 * Init app
 */
async function init(): Promise<State> {
	let warn = false;

	Logger.info('Welcome to Misskey!');
	Logger.info(chalk.bold('Misskey Core <aoi>'));
	Logger.info('Initializing...');

	// Get commit info
	let lastCommitLogger = new Logger('LastCommit');
	try {
		const commit = await prominence(git).getLastCommit();
		const shortHash: string = commit.shortHash;
		const hash: string = commit.hash;
		const commitDate = new Date(parseInt(commit.committedOn, 10) * 1000).toLocaleDateString('ja-JP');
		const commitTime = new Date(parseInt(commit.committedOn, 10) * 1000).toLocaleTimeString('ja-JP');
		lastCommitLogger.info(`${shortHash}${chalk.gray(hash.substr(shortHash.length))}`);
		lastCommitLogger.info(`${commit.subject} ${chalk.green(`(${commitDate} ${commitTime})`)} ${chalk.blue(`<${commit.author.name}>`)}`);
	} catch (e) {
		lastCommitLogger.info('No commit information found');
	}

	let envLogger = new Logger('Env');
	envLogger.info(typeof env == 'undefined' ? 'NODE_ENV is not set' : `NODE_ENV: ${env}`);
	if (IS_DEBUG) {
		envLogger.warn('The environment is not in production mode');
		envLogger.warn('Do not use for production purpose');
	}

	// Get machine info
	const totalmem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
	const freemem = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);
	let machineLogger = new Logger('Machine');
	machineLogger.info(os.hostname());
	machineLogger.info(`CPU: ${os.cpus().length}core`);
	machineLogger.info(`MEM: ${totalmem}GB (available: ${freemem}GB)`);

	let configLogger = new Logger('Config');
	if (!fs.existsSync(`${__dirname}/../.config/config.yml`)) {
		configLogger.error('Configuration not found');
		return State.failed;
	}

	configLogger.info('Successfully loaded');
	configLogger.info(`maintainer: ${config.maintainer}`);

	new DependencyChecker().checkAll();

	if (process.platform === 'linux' && !isRoot() && config.port < 1024) {
		Logger.error('You need root privileges to listen on port below 1024 on Linux');
		return State.failed;
	}

	// Check if a port is being used
	if (await portUsed.check(config.port)) {
		Logger.error(`Port ${config.port} is already used`);
		return State.failed;
	}

	// Try to connect to MongoDB
	let mongoDBLogger = new Logger('MongoDB');
	try {
		const db = await initdb(config);
		mongoDBLogger.info('Successfully connected');
		db.close();
	} catch (e) {
		mongoDBLogger.error(`${e}`);
		return State.failed;
	}

	return warn ? State.warn : State.success;
}

/**
 * Spawn workers
 */
function spawn(callback: any): void {
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
		callback();
	});
}

// Dying away...
process.on('exit', () => {
	Logger.info('The process is going exit');
});

/**
 * Misskey Core Entory Point!
 */

Error.stackTraceLimit = Infinity;

/**
 * Module dependencies
 */
import * as fs from 'fs';
import * as os from 'os';
import * as cluster from 'cluster';
const prominence = require('prominence');
import { log } from './utils/logger';
import * as chalk from 'chalk';
const git = require('git-last-commit');
const portUsed = require('tcp-port-used');
import ProgressBar from './utils/cli/progressbar';
import initdb from './db/mongodb';
import checkDependencies from './utils/check-dependencies';

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
			log('Error', chalk.red('Fatal error occurred :('));
			process.exit();
			return;
		case State.warn:
			log('Warn', chalk.yellow('Some problem(s) :|'));
			break;
		case State.success:
			log('Info', chalk.green('OK :)'));
			break;
	}

	// Spawn workers
	spawn(() => {
		console.log(chalk.bold.green(`\nMisskey Core is now running. [port:${config.port}]`));

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
	log('Info', 'Welcome to Misskey!');

	log('Info', chalk.bold('Misskey Core <aoi>'));

	let warn = false;

	// Get commit info
	try {
		const commit = await prominence(git).getLastCommit();
		const shortHash: string = commit.shortHash;
		const hash: string = commit.hash;
		const commitDate = new Date(parseInt(commit.committedOn, 10) * 1000).toLocaleDateString('ja-JP');
		const commitTime = new Date(parseInt(commit.committedOn, 10) * 1000).toLocaleTimeString('ja-JP');
		log('Info', `${shortHash}${chalk.gray(hash.substr(shortHash.length))}`, 'LastCommit');
		log('Info', `${commit.subject} ${chalk.green(`(${commitDate} ${commitTime})`)} ${chalk.blue(`<${commit.author.name}>`)}`, 'LastCommit');
	} catch (e) {
		log('Info', `No commit information found`, 'LastCommit');
	}

	log('Info', 'Initializing...');

	if (IS_DEBUG) {
		log('Warn', 'It is not in the Production mode. Do not use in the Production environment.');
	}

	log('Info', `environment: ${env}`);

	// Get machine info
	const totalmem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
	const freemem = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);
	log('Info', `${os.hostname()}`, 'Machine');
	log('Info', `CPU: ${os.cpus().length}core`, 'Machine');
	log('Info', `MEM: ${totalmem}GB (available: ${freemem}GB)`, 'Machine');

	if (!fs.existsSync(`${__dirname}/../.config/config.yml`)) {
		log('Error', 'Configuration not found');
		return State.failed;
	}

	log('Info', 'Successfully loaded', 'Config');
	log('Info', `maintainer: ${config.maintainer}`, 'Config');

	checkDependencies();

	// Check if a port is being used
	if (await portUsed.check(config.port)) {
		log('Error', `Port: ${config.port} is already used!`);
		return State.failed;
	}

	// Try to connect to MongoDB
	try {
		const db = await initdb(config);
		log('Info', 'Successfully connected', 'MongoDB');
		db.close();
	} catch (e) {
		log('Error', `${e}`, 'MongoDB');
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
	log('Info', 'Misskey is going down');
});

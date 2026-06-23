/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * This script starts the Misskey backend server, waits for it to be ready,
 * measures memory usage, and outputs the result as JSON.
 *
 * Usage: node scripts/measure-memory.mjs
 */

import { fork } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as http from 'node:http';
import * as fs from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SAMPLE_COUNT = 3; // Number of samples to measure
const STARTUP_TIMEOUT = 120000; // 120 seconds timeout for server startup
const MEMORY_SETTLE_TIME = 10000; // Wait 10 seconds after startup for memory to settle
const IPC_TIMEOUT = 30000; // 30 seconds timeout for IPC responses

const procStatusKeys = {
	VmPeak: 0,
	VmSize: 0,
	VmHWM: 0,
	VmRSS: 0,
	VmData: 0,
	VmStk: 0,
	VmExe: 0,
	VmLib: 0,
	VmPTE: 0,
	VmSwap: 0,
};

const smapsRollupKeys = {
	Pss: 0,
	Shared_Clean: 0,
	Shared_Dirty: 0,
	Private_Clean: 0,
	Private_Dirty: 0,
	Swap: 0,
	SwapPss: 0,
};

const runtimeKeys = {
	HeapTotal: 0,
	HeapUsed: 0,
	External: 0,
	ArrayBuffers: 0,
};

const memoryKeys = {
	...procStatusKeys,
	...smapsRollupKeys,
	...runtimeKeys,
};

const phases = ['beforeGc', 'afterGc', 'afterRequest'];

function parseMemoryFile(content, keys, path, required) {
	const result = {};
	for (const key of Object.keys(keys)) {
		const match = content.match(new RegExp(`${key}:\\s+(\\d+)\\s+kB`));
		if (match) {
			result[key] = parseInt(match[1], 10);
		} else if (required) {
			throw new Error(`Failed to parse ${key} from ${path}`);
		}
	}
	return result;
}

function bytesToKiB(value) {
	return Math.round(value / 1024);
}

async function getMemoryUsage(pid) {
	const path = `/proc/${pid}/status`;
	const status = await fs.readFile(path, 'utf-8');

	return parseMemoryFile(status, procStatusKeys, path, true);
}

async function getSmapsRollupMemoryUsage(pid) {
	const path = `/proc/${pid}/smaps_rollup`;
	try {
		const smapsRollup = await fs.readFile(path, 'utf-8');
		return parseMemoryFile(smapsRollup, smapsRollupKeys, path, false);
	} catch (err) {
		if (err.code === 'ENOENT' || err.code === 'EACCES') {
			process.stderr.write(`Failed to read ${path}: ${err.message}\n`);
			return {};
		}
		throw err;
	}
}

function waitForMessage(serverProcess, predicate, description, timeout = IPC_TIMEOUT) {
	return new Promise((resolve, reject) => {
		const timer = globalThis.setTimeout(() => {
			serverProcess.off('message', onMessage);
			reject(new Error(`Timed out waiting for ${description}`));
		}, timeout);

		const onMessage = (message) => {
			if (!predicate(message)) return;
			globalThis.clearTimeout(timer);
			serverProcess.off('message', onMessage);
			resolve(message);
		};

		serverProcess.on('message', onMessage);
	});
}

async function getRuntimeMemoryUsage(serverProcess) {
	const response = waitForMessage(
		serverProcess,
		message => message != null && typeof message === 'object' && message.type === 'memory usage',
		'memory usage',
	);

	serverProcess.send('memory usage');

	const message = await response;
	const memoryUsage = message.value;

	return {
		HeapTotal: bytesToKiB(memoryUsage.heapTotal),
		HeapUsed: bytesToKiB(memoryUsage.heapUsed),
		External: bytesToKiB(memoryUsage.external),
		ArrayBuffers: bytesToKiB(memoryUsage.arrayBuffers),
	};
}

async function getAllMemoryUsage(serverProcess) {
	const pid = serverProcess.pid;
	return {
		...await getMemoryUsage(pid),
		...await getSmapsRollupMemoryUsage(pid),
		...await getRuntimeMemoryUsage(serverProcess),
	};
}

function median(values) {
	const sorted = values.toSorted((a, b) => a - b);
	const center = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 1) return sorted[center];
	return Math.round((sorted[center - 1] + sorted[center]) / 2);
}

function summarizeResults(results) {
	const summary = {};

	for (const phase of phases) {
		summary[phase] = {};
		for (const key of Object.keys(memoryKeys)) {
			const values = results
				.map(result => result[phase][key])
				.filter(value => Number.isFinite(value));

			if (values.length > 0) {
				summary[phase][key] = median(values);
			}
		}
	}

	return summary;
}

async function measureMemory() {
	// Start the Misskey backend server using fork to enable IPC
	const serverProcess = fork(join(__dirname, '../built/entry.js'), [], {
		cwd: join(__dirname, '..'),
		env: {
			...process.env,
			NODE_ENV: 'production',
			MK_DISABLE_CLUSTERING: '1',
			MK_ONLY_SERVER: '1',
			MK_NO_DAEMONS: '1',
		},
		stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
		execArgv: [...process.execArgv, '--expose-gc'],
	});

	let serverReady = false;

	// Listen for the 'ok' message from the server indicating it's ready
	serverProcess.on('message', (message) => {
		if (message === 'ok') {
			serverReady = true;
		}
	});

	// Handle server output
	serverProcess.stdout?.on('data', (data) => {
		process.stderr.write(`[server stdout] ${data}`);
	});

	serverProcess.stderr?.on('data', (data) => {
		process.stderr.write(`[server stderr] ${data}`);
	});

	// Handle server error
	serverProcess.on('error', (err) => {
		process.stderr.write(`[server error] ${err}\n`);
	});

	async function triggerGc() {
		const ok = waitForMessage(
			serverProcess,
			message => message === 'gc ok' || message === 'gc unavailable',
			'GC completion',
		);

		serverProcess.send('gc');

		const message = await ok;
		if (message === 'gc unavailable') {
			throw new Error('GC is unavailable. Start the process with --expose-gc to enable this feature.');
		}

		await setTimeout(1000);
	}

	function createRequest() {
		return new Promise((resolve, reject) => {
			const req = http.request({
				host: 'localhost',
				port: 61812,
				path: '/api/meta',
				method: 'POST',
			}, (res) => {
				res.on('data', () => { });
				res.on('end', () => {
					resolve();
				});
			});
			req.on('error', (err) => {
				reject(err);
			});
			req.end();
		});
	}

	// Wait for server to be ready or timeout
	const startupStartTime = Date.now();
	while (!serverReady) {
		if (Date.now() - startupStartTime > STARTUP_TIMEOUT) {
			serverProcess.kill('SIGTERM');
			throw new Error('Server startup timeout');
		}
		await setTimeout(100);
	}

	const startupTime = Date.now() - startupStartTime;
	process.stderr.write(`Server started in ${startupTime}ms\n`);

	// Wait for memory to settle
	await setTimeout(MEMORY_SETTLE_TIME);

	const beforeGc = await getAllMemoryUsage(serverProcess);

	await triggerGc();

	const afterGc = await getAllMemoryUsage(serverProcess);

	// create some http requests to simulate load
	const REQUEST_COUNT = 10;
	await Promise.all(
		Array.from({ length: REQUEST_COUNT }).map(() => createRequest()),
	);

	await triggerGc();

	const afterRequest = await getAllMemoryUsage(serverProcess);

	// Stop the server
	serverProcess.kill('SIGTERM');

	// Wait for process to exit
	let exited = false;
	await new Promise((resolve) => {
		serverProcess.on('exit', () => {
			exited = true;
			resolve(undefined);
		});
		// Force kill after 10 seconds if not exited
		setTimeout(10000).then(() => {
			if (!exited) {
				serverProcess.kill('SIGKILL');
			}
			resolve(undefined);
		});
	});

	const result = {
		timestamp: new Date().toISOString(),
		beforeGc,
		afterGc,
		afterRequest,
	};

	return result;
}

async function main() {
	const results = [];
	for (let i = 0; i < SAMPLE_COUNT; i++) {
		process.stderr.write(`Starting sample ${i + 1}/${SAMPLE_COUNT}\n`);
		const res = await measureMemory();
		results.push(res);
	}

	const summary = summarizeResults(results);

	const result = {
		timestamp: new Date().toISOString(),
		sampleCount: SAMPLE_COUNT,
		aggregation: 'median',
		...summary,
		samples: results,
	};

	// Output as JSON to stdout
	console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
	console.error(JSON.stringify({
		error: err.message,
		timestamp: new Date().toISOString(),
	}));
	process.exit(1);
});

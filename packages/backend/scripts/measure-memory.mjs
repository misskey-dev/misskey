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

const keys = {
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

async function getMemoryUsage(pid) {
	const status = await fs.readFile(`/proc/${pid}/status`, 'utf-8');

	const result = {};
	for (const key of Object.keys(keys)) {
		const match = status.match(new RegExp(`${key}:\\s+(\\d+)\\s+kB`));
		if (match) {
			result[key] = parseInt(match[1], 10);
		} else {
			throw new Error(`Failed to parse ${key} from /proc/${pid}/status`);
		}
	}

	return result;
}

async function measureMemory() {
	// Start the Misskey backend server using fork to enable IPC
	const serverProcess = fork(join(__dirname, '../built/boot/entry.js'), ['expose-gc'], {
		cwd: join(__dirname, '..'),
		env: {
			...process.env,
			NODE_ENV: 'production',
			MK_DISABLE_CLUSTERING: '1',
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
		const ok = new Promise((resolve) => {
			serverProcess.once('message', (message) => {
				if (message === 'gc ok') resolve();
			});
		});

		serverProcess.send('gc');

		await ok;

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

	const pid = serverProcess.pid;

	const beforeGc = await getMemoryUsage(pid);

	await triggerGc();

	const afterGc = await getMemoryUsage(pid);

	// create some http requests to simulate load
	const REQUEST_COUNT = 10;
	await Promise.all(
		Array.from({ length: REQUEST_COUNT }).map(() => createRequest()),
	);

	await triggerGc();

	const afterRequest = await getMemoryUsage(pid);

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
	// 直列の方が時間的に分散されて正確そうだから直列でやる
	const results = [];
	for (let i = 0; i < SAMPLE_COUNT; i++) {
		const res = await measureMemory();
		results.push(res);
	}

	// Calculate averages
	const beforeGc = structuredClone(keys);
	const afterGc = structuredClone(keys);
	const afterRequest = structuredClone(keys);
	for (const res of results) {
		for (const key of Object.keys(keys)) {
			beforeGc[key] += res.beforeGc[key];
			afterGc[key] += res.afterGc[key];
			afterRequest[key] += res.afterRequest[key];
		}
	}
	for (const key of Object.keys(keys)) {
		beforeGc[key] = Math.round(beforeGc[key] / SAMPLE_COUNT);
		afterGc[key] = Math.round(afterGc[key] / SAMPLE_COUNT);
		afterRequest[key] = Math.round(afterRequest[key] / SAMPLE_COUNT);
	}

	const result = {
		timestamp: new Date().toISOString(),
		beforeGc,
		afterGc,
		afterRequest,
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

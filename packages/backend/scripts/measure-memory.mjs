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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STARTUP_TIMEOUT = 120000; // 120 seconds timeout for server startup
const MEMORY_SETTLE_TIME = 10000; // Wait 10 seconds after startup for memory to settle

async function measureMemory() {
	const startTime = Date.now();

	// Start the Misskey backend server using fork to enable IPC
	const serverProcess = fork(join(__dirname, '../built/boot/entry.js'), [], {
		cwd: join(__dirname, '..'),
		env: {
			...process.env,
			NODE_ENV: 'test',
		},
		stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
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

	// Get memory usage from the server process via /proc
	const pid = serverProcess.pid;
	let memoryInfo;

	try {
		const fs = await import('node:fs/promises');

		// Read /proc/[pid]/status for detailed memory info
		const status = await fs.readFile(`/proc/${pid}/status`, 'utf-8');
		const vmRssMatch = status.match(/VmRSS:\s+(\d+)\s+kB/);
		const vmDataMatch = status.match(/VmData:\s+(\d+)\s+kB/);
		const vmSizeMatch = status.match(/VmSize:\s+(\d+)\s+kB/);

		memoryInfo = {
			rss: vmRssMatch ? parseInt(vmRssMatch[1], 10) * 1024 : null,
			heapUsed: vmDataMatch ? parseInt(vmDataMatch[1], 10) * 1024 : null,
			vmSize: vmSizeMatch ? parseInt(vmSizeMatch[1], 10) * 1024 : null,
		};
	} catch (err) {
		// Fallback: use ps command
		process.stderr.write(`Warning: Could not read /proc/${pid}/status: ${err}\n`);

		const { execSync } = await import('node:child_process');
		try {
			const ps = execSync(`ps -o rss= -p ${pid}`, { encoding: 'utf-8' });
			const rssKb = parseInt(ps.trim(), 10);
			memoryInfo = {
				rss: rssKb * 1024,
				heapUsed: null,
				vmSize: null,
			};
		} catch {
			memoryInfo = {
				rss: null,
				heapUsed: null,
				vmSize: null,
				error: 'Could not measure memory',
			};
		}
	}

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
		startupTimeMs: startupTime,
		memory: memoryInfo,
	};

	// Output as JSON to stdout
	console.log(JSON.stringify(result, null, 2));
}

measureMemory().catch((err) => {
	console.error(JSON.stringify({
		error: err.message,
		timestamp: new Date().toISOString(),
	}));
	process.exit(1);
});

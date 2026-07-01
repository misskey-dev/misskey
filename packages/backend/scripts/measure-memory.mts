/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ChildProcess, fork } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
//import * as http from 'node:http';
import * as fs from 'node:fs/promises';
import { analyzeHeapSnapshot, defaultHeapSnapshotBreakdownTopN, type HeapSnapshotData } from '../../../.github/scripts/heap-snapshot-util.mts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readIntegerEnv(name, defaultValue, min) {
	const rawValue = process.env[name];
	if (rawValue == null || rawValue === '') return defaultValue;
	if (!/^\d+$/.test(rawValue)) throw new Error(`${name} must be an integer`);

	const value = Number(rawValue);
	if (!Number.isSafeInteger(value) || value < min) throw new Error(`${name} must be >= ${min}`);
	return value;
}

function readBooleanEnv(name, defaultValue) {
	const rawValue = process.env[name];
	if (rawValue == null || rawValue === '') return defaultValue;
	if (rawValue === '1' || rawValue === 'true') return true;
	if (rawValue === '0' || rawValue === 'false') return false;
	throw new Error(`${name} must be one of: 1, 0, true, false`);
}

const SAMPLE_COUNT = readIntegerEnv('MK_MEMORY_SAMPLE_COUNT', 3, 1); // Number of samples to measure
const STARTUP_TIMEOUT = readIntegerEnv('MK_MEMORY_STARTUP_TIMEOUT_MS', 120000, 1); // Timeout for server startup
const MEMORY_SETTLE_TIME = readIntegerEnv('MK_MEMORY_SETTLE_TIME_MS', 10000, 0); // Wait after startup for memory to settle
const IPC_TIMEOUT = readIntegerEnv('MK_MEMORY_IPC_TIMEOUT_MS', 30000, 1); // Timeout for IPC responses
const REQUEST_COUNT = readIntegerEnv('MK_MEMORY_REQUEST_COUNT', 10, 0);
const HEAP_SNAPSHOT = readBooleanEnv('MK_MEMORY_HEAP_SNAPSHOT', false);
const HEAP_SNAPSHOT_TIMEOUT = readIntegerEnv('MK_MEMORY_HEAP_SNAPSHOT_TIMEOUT_MS', 120000, 1);
const HEAP_SNAPSHOT_BREAKDOWN_TOP_N = readIntegerEnv('MK_MEMORY_HEAP_SNAPSHOT_BREAKDOWN_TOP_N', defaultHeapSnapshotBreakdownTopN, 1);
const HEAP_SNAPSHOT_SAVE_PATH = process.env.MK_MEMORY_HEAP_SNAPSHOT_SAVE_PATH;

const procStatusKeys = ['VmPeak', 'VmSize', 'VmHWM', 'VmRSS', 'VmData', 'VmStk', 'VmExe', 'VmLib', 'VmPTE', 'VmSwap'] as const;
const smapsRollupKeys = ['Pss', 'Shared_Clean', 'Shared_Dirty', 'Private_Clean', 'Private_Dirty', 'Swap', 'SwapPss'] as const;

type GcMessage = 'gc ok' | 'gc unavailable';
type RuntimeMemoryUsageMessage = {
	type: 'memory usage';
	value: NodeJS.MemoryUsage;
};
type HeapSnapshotMessage = {
	type: 'heap snapshot';
	path?: string;
};
type HeapSnapshotErrorMessage = {
	type: 'heap snapshot error';
	message: string;
};
type HeapSnapshotResponseMessage = HeapSnapshotMessage | HeapSnapshotErrorMessage;

function parseMemoryFile<KS extends readonly string[]>(content: string, keys: KS, path: string, required: boolean): Record<KS[number], number> {
	const result = {} as Record<KS[number], number>;
	for (const _key of keys) {
		const key = _key as KS[number];
		const match = content.match(new RegExp(`${key}:\\s+(\\d+)\\s+kB`));
		if (match) {
			result[key] = parseInt(match[1], 10);
		} else if (required) {
			throw new Error(`Failed to parse ${key} from ${path}`);
		}
	}
	return result;
}

function bytesToKiB(value: number) {
	return Math.round(value / 1024);
}

async function getMemoryUsage(pid: number) {
	const path = `/proc/${pid}/status`;
	const status = await fs.readFile(path, 'utf-8');
	return parseMemoryFile(status, procStatusKeys, path, true);
}

async function getSmapsRollupMemoryUsage(pid: number) {
	const path = `/proc/${pid}/smaps_rollup`;
	const smapsRollup = await fs.readFile(path, 'utf-8');
	return parseMemoryFile(smapsRollup, smapsRollupKeys, path, false);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value != null && typeof value === 'object';
}

function isGcMessage(message: unknown): message is GcMessage {
	return message === 'gc ok' || message === 'gc unavailable';
}

function isRuntimeMemoryUsageMessage(message: unknown): message is RuntimeMemoryUsageMessage {
	return isRecord(message) && message.type === 'memory usage' && isRecord(message.value);
}

function isHeapSnapshotResponseMessage(message: unknown): message is HeapSnapshotResponseMessage {
	if (!isRecord(message)) return false;
	if (message.type === 'heap snapshot') return true;
	return message.type === 'heap snapshot error' && typeof message.message === 'string';
}

function waitForMessage<T>(serverProcess: ChildProcess, predicate: (message: unknown) => message is T, description: string, timeout = IPC_TIMEOUT) {
	return new Promise<T>((resolve, reject) => {
		const timer = globalThis.setTimeout(() => {
			serverProcess.off('message', onMessage);
			reject(new Error(`Timed out waiting for ${description}`));
		}, timeout);

		const onMessage = (message: unknown) => {
			if (!predicate(message)) return;
			globalThis.clearTimeout(timer);
			serverProcess.off('message', onMessage);
			resolve(message);
		};

		serverProcess.on('message', onMessage);
	});
}

async function getRuntimeMemoryUsage(serverProcess: ChildProcess) {
	const response = waitForMessage(
		serverProcess,
		isRuntimeMemoryUsageMessage,
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

async function getHeapSnapshotStatistics(serverProcess: ChildProcess): Promise<HeapSnapshotData | null> {
	if (!HEAP_SNAPSHOT) return null;

	const snapshotPath = join(tmpdir(), `misskey-backend-heap-${process.pid}-${serverProcess.pid}-${Date.now()}.heapsnapshot`);
	const response = waitForMessage(
		serverProcess,
		isHeapSnapshotResponseMessage,
		'heap snapshot',
		HEAP_SNAPSHOT_TIMEOUT,
	);

	serverProcess.send({
		type: 'heap snapshot',
		path: snapshotPath,
	});

	const message = await response;
	if (message.type === 'heap snapshot error') {
		throw new Error(`Failed to write heap snapshot: ${message.message}`);
	}

	const writtenPath = typeof message.path === 'string' ? message.path : snapshotPath;

	try {
		if (HEAP_SNAPSHOT_SAVE_PATH != null && HEAP_SNAPSHOT_SAVE_PATH !== '') {
			await fs.mkdir(dirname(HEAP_SNAPSHOT_SAVE_PATH), { recursive: true });
			await fs.copyFile(writtenPath, HEAP_SNAPSHOT_SAVE_PATH);
		}

		const snapshot = JSON.parse(await fs.readFile(writtenPath, 'utf-8'));
		return analyzeHeapSnapshot(snapshot, { breakdownTopN: HEAP_SNAPSHOT_BREAKDOWN_TOP_N });
	} finally {
		await fs.unlink(writtenPath).catch(err => {
			process.stderr.write(`Failed to delete heap snapshot ${writtenPath}: ${err.message}\n`);
		});
	}
}

async function getAllMemoryUsage(serverProcess: ChildProcess) {
	const pid = serverProcess.pid!;
	return {
		...await getMemoryUsage(pid),
		...await getSmapsRollupMemoryUsage(pid),
		...await getRuntimeMemoryUsage(serverProcess),
	};
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
			isGcMessage,
			'GC completion',
		);

		serverProcess.send('gc');

		const message = await ok;
		if (message === 'gc unavailable') {
			throw new Error('GC is unavailable. Start the process with --expose-gc to enable this feature.');
		}

		await setTimeout(1000);
	}

	//function createRequest() {
	//	return new Promise((resolve, reject) => {
	//		const req = http.request({
	//			host: 'localhost',
	//			port: 61812,
	//			path: '/api/meta',
	//			method: 'POST',
	//		}, (res) => {
	//			res.on('data', () => { });
	//			res.on('end', () => {
	//				resolve();
	//			});
	//		});
	//		req.on('error', (err) => {
	//			reject(err);
	//		});
	//		req.end();
	//	});
	//}

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

	//const beforeGc = await getAllMemoryUsage(serverProcess);

	await triggerGc();

	const memoryUsageAfterGC = await getAllMemoryUsage(serverProcess);

	//// create some http requests to simulate load
	//await Promise.all(
	//	Array.from({ length: REQUEST_COUNT }).map(() => createRequest()),
	//);

	//await triggerGc();

	//const afterRequest = await getAllMemoryUsage(serverProcess);

	const heapSnapshotAfterGc = await getHeapSnapshotStatistics(serverProcess);

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
		phases: {
			//beforeGc,
			afterGc: {
				memoryUsage: memoryUsageAfterGC,
				heapSnapshot: heapSnapshotAfterGc,
			},
			//afterRequest,
		},
	};

	return result;
}

export type MemoryReportRaw = {
	timestamp: string;
	sampleCount: number;
	measurement: {
		startupTimeoutMs: number;
		memorySettleTimeMs: number;
		ipcTimeoutMs: number;
		requestCount: number;
		heapSnapshot: {
			enabled: boolean;
			timeoutMs: number;
			breakdownTopN: number;
		};
	};
	samples: Awaited<ReturnType<typeof measureMemory>>[];
};

async function main() {
	const results = [];
	for (let i = 0; i < SAMPLE_COUNT; i++) {
		process.stderr.write(`Starting sample ${i + 1}/${SAMPLE_COUNT}\n`);
		const res = await measureMemory();
		results.push(res);
	}

	const result: MemoryReportRaw = {
		timestamp: new Date().toISOString(),
		sampleCount: SAMPLE_COUNT,
		measurement: {
			startupTimeoutMs: STARTUP_TIMEOUT,
			memorySettleTimeMs: MEMORY_SETTLE_TIME,
			ipcTimeoutMs: IPC_TIMEOUT,
			requestCount: REQUEST_COUNT,
			heapSnapshot: {
				enabled: HEAP_SNAPSHOT,
				timeoutMs: HEAP_SNAPSHOT_TIMEOUT,
				breakdownTopN: HEAP_SNAPSHOT_BREAKDOWN_TOP_N,
			},
		},
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

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ChildProcess, fork } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import * as fs from 'node:fs/promises';
import { analyzeHeapSnapshot, defaultHeapSnapshotBreakdownTopN, type HeapSnapshotData } from '../../../.github/scripts/heap-snapshot-util.mts';
import { measureMemoryUntilStable } from '../../../.github/scripts/memory-stability-util.mts';

const backendDir = process.env.MK_MEMORY_BACKEND_DIR == null || process.env.MK_MEMORY_BACKEND_DIR === ''
	? join(import.meta.dirname, '..')
	: resolve(process.env.MK_MEMORY_BACKEND_DIR);

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

const STARTUP_TIMEOUT = readIntegerEnv('MK_MEMORY_STARTUP_TIMEOUT_MS', 120000, 1); // Timeout for server startup
const IPC_TIMEOUT = readIntegerEnv('MK_MEMORY_IPC_TIMEOUT_MS', 30000, 1); // Timeout for IPC responses
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

function parseMemoryFile<KS extends readonly string[]>(content: string, keys: KS, path: string): Record<KS[number], number> {
	const result = {} as Record<KS[number], number>;
	for (const _key of keys) {
		const key = _key as KS[number];
		const match = content.match(new RegExp(`${key}:\\s+(\\d+)\\s+kB`));
		if (match) {
			result[key] = parseInt(match[1], 10);
		} else {
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
	return parseMemoryFile(status, procStatusKeys, path);
}

async function getSmapsRollupMemoryUsage(pid: number) {
	const path = `/proc/${pid}/smaps_rollup`;
	const smapsRollup = await fs.readFile(path, 'utf-8');
	return parseMemoryFile(smapsRollup, smapsRollupKeys, path);
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
	const stableSmapsRollup = await measureMemoryUntilStable(
		() => getSmapsRollupMemoryUsage(pid),
	);

	return {
		memoryUsage: {
			...await getMemoryUsage(pid),
			...stableSmapsRollup.memoryUsage,
			...await getRuntimeMemoryUsage(serverProcess),
		},
		stability: stableSmapsRollup.stability,
	};
}

async function measureMemory() {
	const serverProcess = fork(join(backendDir, 'built/entry.js'), [], {
		cwd: backendDir,
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

	const serverReady = waitForMessage(
		serverProcess,
		(message): message is 'ok' => message === 'ok',
		'server startup',
		STARTUP_TIMEOUT,
	);

	serverProcess.stdout?.on('data', (data) => {
		process.stderr.write(`[server stdout] ${data}`);
	});

	serverProcess.stderr?.on('data', (data) => {
		process.stderr.write(`[server stderr] ${data}`);
	});

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
	}

	const startupStartTime = Date.now();
	try {
		await serverReady;
	} catch (err) {
		serverProcess.kill('SIGTERM');
		throw err;
	}

	const startupTime = Date.now() - startupStartTime;
	process.stderr.write(`Server started in ${startupTime}ms\n`);

	await triggerGc();

	const afterGc = await getAllMemoryUsage(serverProcess);
	process.stderr.write(`Memory ${afterGc.stability.converged ? 'stabilized' : 'did not stabilize'} after ${afterGc.stability.readingCount} readings over ${Math.round(afterGc.stability.elapsedMs)}ms\n`);

	const heapSnapshotAfterGc = await getHeapSnapshotStatistics(serverProcess);

	const serverExited = new Promise<void>(resolve => {
		const timer = globalThis.setTimeout(() => {
			serverProcess.kill('SIGKILL');
			resolve();
		}, 10000);
		serverProcess.once('exit', () => {
			globalThis.clearTimeout(timer);
			resolve();
		});
	});
	serverProcess.kill('SIGTERM');
	await serverExited;

	return {
		timestamp: new Date().toISOString(),
		phases: {
			afterGc: {
				memoryUsage: afterGc.memoryUsage,
				memoryStability: afterGc.stability,
				heapSnapshot: heapSnapshotAfterGc,
			},
		},
	};
}

export type MemorySample = Awaited<ReturnType<typeof measureMemory>>;

async function main() {
	console.log(JSON.stringify(await measureMemory(), null, 2));
}

main().catch((err) => {
	console.error(JSON.stringify({
		error: err.message,
		timestamp: new Date().toISOString(),
	}));
	process.exit(1);
});

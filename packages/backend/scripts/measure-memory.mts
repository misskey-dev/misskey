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
import { heapSnapshotCategory, type HeapSnapshotData } from '../../../.github/scripts/heap-snapshot-util.mts';

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
const HEAP_SNAPSHOT_BREAKDOWN_TOP_N = readIntegerEnv('MK_MEMORY_HEAP_SNAPSHOT_BREAKDOWN_TOP_N', 6, 1);

const procStatusKeys = ['VmPeak', 'VmSize', 'VmHWM', 'VmRSS', 'VmData', 'VmStk', 'VmExe', 'VmLib', 'VmPTE', 'VmSwap'] as const;
const smapsRollupKeys = ['Pss', 'Shared_Clean', 'Shared_Dirty', 'Private_Clean', 'Private_Dirty', 'Swap', 'SwapPss'] as const;

const typedArrayNames = new Set([
	'ArrayBuffer',
	'SharedArrayBuffer',
	'DataView',
	'Int8Array',
	'Uint8Array',
	'Uint8ClampedArray',
	'Int16Array',
	'Uint16Array',
	'Int32Array',
	'Uint32Array',
	'Float16Array',
	'Float32Array',
	'Float64Array',
	'BigInt64Array',
	'BigUint64Array',
	'system / JSArrayBufferData',
]);

const otherJsNodeTypes = new Set([
	'object',
	'closure',
	'regexp',
	'number',
	'symbol',
	'bigint',
]);

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

function isTypedArrayNode(type, name) {
	return typedArrayNames.has(name) ||
		(type === 'native' && (name.includes('ArrayBuffer') || name.includes('TypedArray')));
}

function isSystemNode(type, name) {
	return type === 'hidden' ||
		type === 'synthetic' ||
		type === 'object shape' ||
		name.startsWith('system /') ||
		name.startsWith('(system ');
}

function classifyHeapSnapshotNode(type, name): keyof typeof heapSnapshotCategory {
	if (type === 'code') return 'code';
	if (type === 'string' || type === 'concatenated string' || type === 'sliced string') return 'strings';
	if (isTypedArrayNode(type, name)) return 'typedArrays';
	if (type === 'array' || (type === 'object' && name === 'Array')) return 'jsArrays';
	if (isSystemNode(type, name)) return 'systemObjects';
	if (otherJsNodeTypes.has(type)) return 'otherJsObjects';
	return 'otherNonJsObjects';
}

function sanitizeHeapSnapshotBreakdownLabel(value, fallback = 'unknown') {
	const label = String(value ?? '').replace(/\s+/g, ' ').trim();
	if (label === '') return fallback;
	if (label.length <= 80) return label;
	return `${label.slice(0, 77)}...`;
}

function classifyHeapSnapshotBreakdown(category: keyof typeof heapSnapshotCategory, type, name) {
	if (category === 'strings') return type;

	if (category === 'jsArrays') {
		if (type === 'array') return 'array nodes';
		if (type === 'object' && name === 'Array') return 'Array objects';
		return sanitizeHeapSnapshotBreakdownLabel(`${type}: ${name}`);
	}

	if (category === 'typedArrays') {
		if (name === 'system / JSArrayBufferData') return 'ArrayBuffer data';
		if (name === 'Uint8Array') return 'Uint8Array / Buffer';
		if (typedArrayNames.has(name)) return name;
		if (type === 'native' && name.includes('ArrayBuffer')) return 'native ArrayBuffer';
		if (type === 'native' && name.includes('TypedArray')) return 'native TypedArray';
		return sanitizeHeapSnapshotBreakdownLabel(`${type}: ${name}`);
	}

	if (category === 'systemObjects') {
		if (name.startsWith('system /')) return sanitizeHeapSnapshotBreakdownLabel(name);
		if (name.startsWith('(system ')) return sanitizeHeapSnapshotBreakdownLabel(name);
		return sanitizeHeapSnapshotBreakdownLabel(`${type}: ${name}`, type);
	}

	if (category === 'otherJsObjects') {
		if (type === 'object') return sanitizeHeapSnapshotBreakdownLabel(`object: ${name}`, 'object: unknown');
		return type;
	}

	if (category === 'otherNonJsObjects') {
		if (type === 'native') return sanitizeHeapSnapshotBreakdownLabel(`native: ${name}`, 'native: unknown');
		return sanitizeHeapSnapshotBreakdownLabel(`${type}: ${name}`, type);
	}

	if (category === 'code') {
		const lowerName = name.toLowerCase();
		if (lowerName.includes('bytecode')) return 'bytecode';
		if (lowerName.includes('builtin')) return 'builtins';
		if (lowerName.includes('regexp')) return 'regexp code';
		if (lowerName.includes('stub')) return 'stubs';
		return sanitizeHeapSnapshotBreakdownLabel(`code: ${name}`, 'code: unknown');
	}

	return sanitizeHeapSnapshotBreakdownLabel(`${type}: ${name}`, type);
}

function collapseHeapSnapshotBreakdown(breakdowns: Record<string, Record<string, number>>) {
	const collapsed = {} as Record<string, Record<string, number>>;

	for (const [category, children] of Object.entries(breakdowns)) {
		const entries = Object.entries(children)
			.filter(([, value]) => value > 0)
			.toSorted((a, b) => b[1] - a[1]);

		const topEntries = entries.slice(0, HEAP_SNAPSHOT_BREAKDOWN_TOP_N);
		const otherValue = entries
			.slice(HEAP_SNAPSHOT_BREAKDOWN_TOP_N)
			.reduce((sum, [, value]) => sum + value, 0);

		const categoryBreakdown = Object.fromEntries(topEntries);
		if (otherValue > 0) categoryBreakdown.Other = otherValue;
		if (Object.keys(categoryBreakdown).length > 0) collapsed[category] = categoryBreakdown;
	}

	return collapsed;
}

function analyzeHeapSnapshot(snapshot) {
	const meta = snapshot?.snapshot?.meta;
	const nodes = snapshot?.nodes;
	const strings = snapshot?.strings;
	if (meta == null || !Array.isArray(nodes) || !Array.isArray(strings)) {
		throw new Error('Invalid heap snapshot format');
	}

	const nodeFields = meta.node_fields;
	if (!Array.isArray(nodeFields)) throw new Error('Invalid heap snapshot node fields');

	const typeOffset = nodeFields.indexOf('type');
	const nameOffset = nodeFields.indexOf('name');
	const selfSizeOffset = nodeFields.indexOf('self_size');
	if (typeOffset < 0 || nameOffset < 0 || selfSizeOffset < 0) {
		throw new Error('Heap snapshot is missing required node fields');
	}

	const nodeTypeNames = meta.node_types?.[typeOffset];
	if (!Array.isArray(nodeTypeNames)) throw new Error('Invalid heap snapshot node types');

	function createEmptyHeapSnapshotCategoryMap() {
		return Object.fromEntries(Object.keys(heapSnapshotCategory).map(category => [category, 0])) as Record<keyof typeof heapSnapshotCategory, number>;
	}

	const fieldCount = nodeFields.length;
	const categories = createEmptyHeapSnapshotCategoryMap();
	const nodeCounts = createEmptyHeapSnapshotCategoryMap();
	const breakdowns = Object.fromEntries(
		(Object.keys(heapSnapshotCategory) as (keyof typeof heapSnapshotCategory)[])
			.filter(category => category !== 'total')
			.map(category => [category, {}]),
	);

	function addValue(map: Record<string, number>, key: string, value: number) {
		map[key] = (map[key] ?? 0) + value;
	}

	for (let offset = 0; offset < nodes.length; offset += fieldCount) {
		const type = nodeTypeNames[nodes[offset + typeOffset]] ?? 'unknown';
		const name = strings[nodes[offset + nameOffset]] ?? '';
		const selfSize = nodes[offset + selfSizeOffset] ?? 0;
		const category = classifyHeapSnapshotNode(type, name);

		categories[category] += selfSize;
		categories.total += selfSize;
		nodeCounts[category]++;
		nodeCounts.total++;
		addValue(breakdowns[category], classifyHeapSnapshotBreakdown(category, type, name), selfSize);
	}

	return {
		categories,
		nodeCounts,
		breakdowns: collapseHeapSnapshotBreakdown(breakdowns),
	};
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

async function getRuntimeMemoryUsage(serverProcess: ChildProcess) {
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

async function getHeapSnapshotStatistics(serverProcess: ChildProcess): Promise<HeapSnapshotData | null> {
	if (!HEAP_SNAPSHOT) return null;

	const snapshotPath = join(tmpdir(), `misskey-backend-heap-${process.pid}-${serverProcess.pid}-${Date.now()}.heapsnapshot`);
	const response = waitForMessage(
		serverProcess,
		message => message != null && typeof message === 'object' && (message.type === 'heap snapshot' || message.type === 'heap snapshot error'),
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
		const snapshot = JSON.parse(await fs.readFile(writtenPath, 'utf-8'));
		return analyzeHeapSnapshot(snapshot);
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

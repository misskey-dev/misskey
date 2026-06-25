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
import { tmpdir } from 'node:os';
import * as http from 'node:http';
import * as fs from 'node:fs/promises';

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

const heapSnapshotCategories = [
	'Code',
	'Strings',
	'JS arrays',
	'Typed arrays',
	'System objects',
	'Other JS objects',
	'Other non-JS objects',
	'Total',
];

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

function createEmptyHeapSnapshotCategoryMap() {
	return Object.fromEntries(heapSnapshotCategories.map(category => [category, 0]));
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

function classifyHeapSnapshotNode(type, name) {
	if (type === 'code') return 'Code';
	if (type === 'string' || type === 'concatenated string' || type === 'sliced string') return 'Strings';
	if (isTypedArrayNode(type, name)) return 'Typed arrays';
	if (type === 'array' || (type === 'object' && name === 'Array')) return 'JS arrays';
	if (isSystemNode(type, name)) return 'System objects';
	if (otherJsNodeTypes.has(type)) return 'Other JS objects';
	return 'Other non-JS objects';
}

function addValue(map, key, value) {
	map[key] = (map[key] ?? 0) + value;
}

function sanitizeHeapSnapshotBreakdownLabel(value, fallback = 'unknown') {
	const label = String(value ?? '').replace(/\s+/g, ' ').trim();
	if (label === '') return fallback;
	if (label.length <= 80) return label;
	return `${label.slice(0, 77)}...`;
}

function classifyHeapSnapshotBreakdown(category, type, name) {
	if (category === 'Strings') return type;

	if (category === 'JS arrays') {
		if (type === 'array') return 'array nodes';
		if (type === 'object' && name === 'Array') return 'Array objects';
		return sanitizeHeapSnapshotBreakdownLabel(`${type}: ${name}`);
	}

	if (category === 'Typed arrays') {
		if (name === 'system / JSArrayBufferData') return 'ArrayBuffer data';
		if (name === 'Uint8Array') return 'Uint8Array / Buffer';
		if (typedArrayNames.has(name)) return name;
		if (type === 'native' && name.includes('ArrayBuffer')) return 'native ArrayBuffer';
		if (type === 'native' && name.includes('TypedArray')) return 'native TypedArray';
		return sanitizeHeapSnapshotBreakdownLabel(`${type}: ${name}`);
	}

	if (category === 'System objects') {
		if (name.startsWith('system /')) return sanitizeHeapSnapshotBreakdownLabel(name);
		if (name.startsWith('(system ')) return sanitizeHeapSnapshotBreakdownLabel(name);
		return sanitizeHeapSnapshotBreakdownLabel(`${type}: ${name}`, type);
	}

	if (category === 'Other JS objects') {
		if (type === 'object') return sanitizeHeapSnapshotBreakdownLabel(`object: ${name}`, 'object: unknown');
		return type;
	}

	if (category === 'Other non-JS objects') {
		if (type === 'native') return sanitizeHeapSnapshotBreakdownLabel(`native: ${name}`, 'native: unknown');
		return sanitizeHeapSnapshotBreakdownLabel(`${type}: ${name}`, type);
	}

	if (category === 'Code') {
		const lowerName = name.toLowerCase();
		if (lowerName.includes('bytecode')) return 'bytecode';
		if (lowerName.includes('builtin')) return 'builtins';
		if (lowerName.includes('regexp')) return 'regexp code';
		if (lowerName.includes('stub')) return 'stubs';
		return sanitizeHeapSnapshotBreakdownLabel(`code: ${name}`, 'code: unknown');
	}

	return sanitizeHeapSnapshotBreakdownLabel(`${type}: ${name}`, type);
}

function collapseHeapSnapshotBreakdown(breakdowns) {
	const collapsed = {};

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

	const fieldCount = nodeFields.length;
	const categories = createEmptyHeapSnapshotCategoryMap();
	const nodeCounts = createEmptyHeapSnapshotCategoryMap();
	const breakdowns = Object.fromEntries(
		heapSnapshotCategories
			.filter(category => category !== 'Total')
			.map(category => [category, {}]),
	);

	for (let offset = 0; offset < nodes.length; offset += fieldCount) {
		const type = nodeTypeNames[nodes[offset + typeOffset]] ?? 'unknown';
		const name = strings[nodes[offset + nameOffset]] ?? '';
		const selfSize = nodes[offset + selfSizeOffset] ?? 0;
		const category = classifyHeapSnapshotNode(type, name);

		categories[category] += selfSize;
		categories.Total += selfSize;
		nodeCounts[category]++;
		nodeCounts.Total++;
		addValue(breakdowns[category], classifyHeapSnapshotBreakdown(category, type, name), selfSize);
	}

	return {
		categories,
		nodeCounts,
		breakdowns: collapseHeapSnapshotBreakdown(breakdowns),
	};
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

async function getHeapSnapshotStatistics(serverProcess) {
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

function summarizeHeapSnapshotBreakdowns(results, phase) {
	const breakdowns = {};

	for (const category of heapSnapshotCategories) {
		if (category === 'Total') continue;

		const childKeys = new Set();
		for (const result of results) {
			for (const childKey of Object.keys(result[phase]?.heapSnapshot?.breakdowns?.[category] ?? {})) {
				childKeys.add(childKey);
			}
		}

		const categoryBreakdown = {};
		for (const childKey of childKeys) {
			const values = results
				.map(result => result[phase]?.heapSnapshot?.breakdowns?.[category]?.[childKey])
				.filter(value => Number.isFinite(value));

			if (values.length > 0) categoryBreakdown[childKey] = median(values);
		}

		if (Object.keys(categoryBreakdown).length > 0) {
			breakdowns[category] = collapseHeapSnapshotBreakdown({ [category]: categoryBreakdown })[category] ?? categoryBreakdown;
		}
	}

	return breakdowns;
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

		const heapSnapshotCategoryValues = {};
		for (const category of heapSnapshotCategories) {
			const values = results
				.map(result => result[phase]?.heapSnapshot?.categories?.[category])
				.filter(value => Number.isFinite(value));

			if (values.length > 0) heapSnapshotCategoryValues[category] = median(values);
		}

		const heapSnapshotNodeCountValues = {};
		for (const category of heapSnapshotCategories) {
			const values = results
				.map(result => result[phase]?.heapSnapshot?.nodeCounts?.[category])
				.filter(value => Number.isFinite(value));

			if (values.length > 0) heapSnapshotNodeCountValues[category] = median(values);
		}

		if (Object.keys(heapSnapshotCategoryValues).length > 0) {
			const heapSnapshotBreakdowns = summarizeHeapSnapshotBreakdowns(results, phase);

			summary[phase].heapSnapshot = {
				categories: heapSnapshotCategoryValues,
				nodeCounts: heapSnapshotNodeCountValues,
				...(Object.keys(heapSnapshotBreakdowns).length > 0 ? { breakdowns: heapSnapshotBreakdowns } : {}),
			};
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
	await Promise.all(
		Array.from({ length: REQUEST_COUNT }).map(() => createRequest()),
	);

	await triggerGc();

	const afterRequest = await getAllMemoryUsage(serverProcess);
	const heapSnapshot = await getHeapSnapshotStatistics(serverProcess);
	if (heapSnapshot != null) afterRequest.heapSnapshot = heapSnapshot;

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

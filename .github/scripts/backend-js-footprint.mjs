/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { fork, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { cpus, tmpdir } from 'node:os';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as http from 'node:http';
import * as util from './utility.mts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const [repoDirArg, outputFileArg] = process.argv.slice(2);

const STARTUP_TIMEOUT = util.readIntegerEnv('MK_JS_FOOTPRINT_STARTUP_TIMEOUT_MS', 120000, 1);
const SETTLE_TIME = util.readIntegerEnv('MK_JS_FOOTPRINT_SETTLE_TIME_MS', 10000, 0);
const REQUEST_COUNT = util.readIntegerEnv('MK_JS_FOOTPRINT_REQUEST_COUNT', 10, 0);
const MAX_TABLE_ITEMS = util.readIntegerEnv('MK_JS_FOOTPRINT_MAX_ITEMS', 20, 1);

const repoDir = resolve(repoDirArg);
const outputFile = resolve(outputFileArg);
const backendDir = join(repoDir, 'packages/backend');
const backendBuiltDir = join(backendDir, 'built');
const traceFile = join(tmpdir(), `misskey-backend-js-footprint-${process.pid}-${Date.now()}.jsonl`);
const require = createRequire(join(repoDir, 'package.json'));
const ts = require('typescript');
const jsExtensions = new Set(['.js', '.mjs', '.cjs']);
const fileMetricCache = new Map();
const packageInfoCache = new Map();
const nativePackageNames = new Set();

function isInside(parent, child) {
	const rel = relative(parent, child);
	return rel === '' || (!rel.startsWith('..') && !rel.includes(`..${sep}`));
}

function bytesToKiB(value) {
	return Math.round(value / 1024);
}

async function resetState() {
	const backendRequire = createRequire(join(backendDir, 'package.json'));
	const pg = backendRequire('pg');
	const Redis = backendRequire('ioredis');

	const postgres = new pg.Client({
		host: '127.0.0.1',
		port: 54312,
		database: 'postgres',
		user: 'postgres',
	});

	await postgres.connect();
	try {
		await postgres.query('DROP DATABASE IF EXISTS "test-misskey" WITH (FORCE)');
		await postgres.query('CREATE DATABASE "test-misskey"');
	} finally {
		await postgres.end();
	}

	const redis = new Redis({ host: '127.0.0.1', port: 56312 });
	try {
		await redis.flushall();
	} finally {
		redis.disconnect();
	}
}

function createRequest() {
	return new Promise((resolvePromise, reject) => {
		const req = http.request({
			host: 'localhost',
			port: 61812,
			path: '/api/meta',
			method: 'POST',
		}, res => {
			res.on('data', () => { });
			res.on('end', () => resolvePromise());
		});
		req.on('error', reject);
		req.end();
	});
}

async function waitForServerReady(serverProcess) {
	let serverReady = false;
	serverProcess.on('message', message => {
		if (message === 'ok') serverReady = true;
	});

	const startupStartTime = Date.now();
	while (!serverReady) {
		if (Date.now() - startupStartTime > STARTUP_TIMEOUT) {
			serverProcess.kill('SIGTERM');
			throw new Error('Server startup timeout');
		}
		await setTimeout(100);
	}
}

async function stopServer(serverProcess) {
	serverProcess.kill('SIGTERM');

	let exited = false;
	await new Promise(resolvePromise => {
		serverProcess.on('exit', () => {
			exited = true;
			resolvePromise(undefined);
		});

		setTimeout(10000).then(() => {
			if (!exited) serverProcess.kill('SIGKILL');
			resolvePromise(undefined);
		});
	});
}

function getPackageNameFromPath(filePath) {
	const normalized = util.normalizePath(filePath);
	const marker = '/node_modules/';
	const index = normalized.lastIndexOf(marker);
	if (index === -1) return null;

	const rest = normalized.slice(index + marker.length).split('/');
	if (rest[0] === '.pnpm') {
		const nestedNodeModulesIndex = rest.indexOf('node_modules');
		if (nestedNodeModulesIndex === -1) return null;
		const packageParts = rest.slice(nestedNodeModulesIndex + 1);
		if (packageParts.length === 0) return null;
		return packageParts[0].startsWith('@') ? packageParts.slice(0, 2).join('/') : packageParts[0];
	}

	return rest[0]?.startsWith('@') ? rest.slice(0, 2).join('/') : rest[0] ?? null;
}

function findPackageDir(filePath, packageName) {
	const normalizedPackageName = packageName.split('/').join(sep);
	let current = dirname(filePath);

	while (current !== dirname(current)) {
		if (current.endsWith(`${sep}${normalizedPackageName}`) && fsSync.existsSync(join(current, 'package.json'))) {
			return current;
		}

		const parent = dirname(current);
		if (parent === current) break;
		current = parent;
	}

	return null;
}

function readPackageInfo(filePath) {
	const externalPackageName = getPackageNameFromPath(filePath);
	if (externalPackageName != null) {
		const packageDir = findPackageDir(filePath, externalPackageName);
		const cacheKey = packageDir ?? externalPackageName;
		if (packageInfoCache.has(cacheKey)) return packageInfoCache.get(cacheKey);

		let version = null;
		if (packageDir != null) {
			try {
				const packageJson = JSON.parse(fsSync.readFileSync(join(packageDir, 'package.json'), 'utf8'));
				version = typeof packageJson.version === 'string' ? packageJson.version : null;
			} catch { }
		}

		const info = {
			category: 'external',
			name: externalPackageName,
			version,
			dir: packageDir,
		};
		packageInfoCache.set(cacheKey, info);
		return info;
	}

	if (isInside(backendBuiltDir, filePath)) {
		return {
			category: 'internal',
			name: 'backend',
			version: null,
			dir: backendDir,
		};
	}

	return {
		category: 'internal',
		name: 'workspace',
		version: null,
		dir: repoDir,
	};
}

function analyzeSource(filePath, source) {
	const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
	const metrics = {
		astNodeCount: 0,
		functionCount: 0,
		classCount: 0,
		stringLiteralBytes: 0,
	};

	function visit(node) {
		metrics.astNodeCount += 1;

		if (
			ts.isFunctionDeclaration(node) ||
			ts.isFunctionExpression(node) ||
			ts.isArrowFunction(node) ||
			ts.isMethodDeclaration(node) ||
			ts.isConstructorDeclaration(node) ||
			ts.isGetAccessorDeclaration(node) ||
			ts.isSetAccessorDeclaration(node)
		) {
			metrics.functionCount += 1;
		} else if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
			metrics.classCount += 1;
		} else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
			metrics.stringLiteralBytes += Buffer.byteLength(node.text);
		}

		ts.forEachChild(node, visit);
	}

	visit(sourceFile);
	return metrics;
}

function readFileMetrics(filePath) {
	if (fileMetricCache.has(filePath)) return fileMetricCache.get(filePath);

	const source = fsSync.readFileSync(filePath);
	const sourceText = source.toString('utf8');
	const astMetrics = analyzeSource(filePath, sourceText);
	const packageInfo = readPackageInfo(filePath);
	const metric = {
		path: filePath,
		displayPath: util.normalizePath(relative(repoDir, filePath)),
		sourceBytes: source.byteLength,
		gzipBytes: gzipSync(source).byteLength,
		...astMetrics,
		package: packageInfo,
	};

	fileMetricCache.set(filePath, metric);
	return metric;
}

async function readTraceRecords() {
	let content = '';
	try {
		content = await fs.readFile(traceFile, 'utf8');
	} catch (err) {
		if (err.code === 'ENOENT') return [];
		throw err;
	}

	const records = [];
	for (const line of content.split('\n')) {
		if (line.trim() === '') continue;
		try {
			records.push(JSON.parse(line));
		} catch { }
	}
	return records;
}

function emptyTotals() {
	return {
		loadedJsModules: 0,
		loadedJsSourceBytes: 0,
		loadedJsGzipBytes: 0,
		astNodeCount: 0,
		functionCount: 0,
		classCount: 0,
		stringLiteralBytes: 0,
		externalPackageCount: 0,
		nativeAddonPackageCount: 0,
	};
}

function addFileMetrics(target, metric) {
	target.loadedJsModules += 1;
	target.loadedJsSourceBytes += metric.sourceBytes;
	target.loadedJsGzipBytes += metric.gzipBytes;
	target.astNodeCount += metric.astNodeCount;
	target.functionCount += metric.functionCount;
	target.classCount += metric.classCount;
	target.stringLiteralBytes += metric.stringLiteralBytes;
}

function summarizeRecords(records, phase) {
	const jsPaths = new Set();
	const nativePaths = new Set();

	for (const record of records) {
		if (typeof record.path !== 'string') continue;

		const extension = extname(record.path);
		if (jsExtensions.has(extension)) {
			jsPaths.add(resolve(record.path));
		} else if (extension === '.node') {
			nativePaths.add(resolve(record.path));
		}
	}

	for (const nativePath of nativePaths) {
		const packageInfo = readPackageInfo(nativePath);
		if (packageInfo.category === 'external') nativePackageNames.add(packageInfo.name);
	}

	const totals = emptyTotals();
	const packages = new Map();
	const modules = [];

	for (const filePath of [...jsPaths].toSorted()) {
		let metric;
		try {
			metric = readFileMetrics(filePath);
		} catch (err) {
			process.stderr.write(`Failed to analyze ${filePath}: ${err.message}\n`);
			continue;
		}

		addFileMetrics(totals, metric);

		const packageKey = metric.package.name;
		if (!packages.has(packageKey)) {
			packages.set(packageKey, {
				name: metric.package.name,
				version: metric.package.version,
				category: metric.package.category,
				sourceBytes: 0,
				gzipBytes: 0,
				modules: 0,
				astNodeCount: 0,
				functionCount: 0,
				classCount: 0,
				stringLiteralBytes: 0,
				nativeAddon: false,
			});
		}

		const packageSummary = packages.get(packageKey);
		packageSummary.sourceBytes += metric.sourceBytes;
		packageSummary.gzipBytes += metric.gzipBytes;
		packageSummary.modules += 1;
		packageSummary.astNodeCount += metric.astNodeCount;
		packageSummary.functionCount += metric.functionCount;
		packageSummary.classCount += metric.classCount;
		packageSummary.stringLiteralBytes += metric.stringLiteralBytes;

		modules.push({
			path: metric.displayPath,
			package: metric.package.name,
			category: metric.package.category,
			sourceBytes: metric.sourceBytes,
			gzipBytes: metric.gzipBytes,
			astNodeCount: metric.astNodeCount,
			functionCount: metric.functionCount,
			classCount: metric.classCount,
			stringLiteralBytes: metric.stringLiteralBytes,
		});
	}

	for (const packageName of nativePackageNames) {
		const packageSummary = packages.get(packageName);
		if (packageSummary != null) packageSummary.nativeAddon = true;
	}

	const externalPackages = [...packages.values()].filter(packageSummary => packageSummary.category === 'external');
	totals.externalPackageCount = externalPackages.length;
	totals.nativeAddonPackageCount = externalPackages.filter(packageSummary => packageSummary.nativeAddon).length;

	return {
		totals: {
			...totals,
			loadedJsSourceKiB: bytesToKiB(totals.loadedJsSourceBytes),
			loadedJsGzipKiB: bytesToKiB(totals.loadedJsGzipBytes),
			stringLiteralKiB: bytesToKiB(totals.stringLiteralBytes),
		},
		packages: [...packages.values()].toSorted((a, b) => b.sourceBytes - a.sourceBytes),
		modules: modules.toSorted((a, b) => b.sourceBytes - a.sourceBytes).slice(0, MAX_TABLE_ITEMS),
	};
}

async function measureFootprint() {
	await fs.writeFile(traceFile, '');

	process.stderr.write('Resetting database and Redis\n');
	await resetState();

	process.stderr.write('Running migrations\n');
	await util.run('pnpm', ['--filter', 'backend', 'migrate'], {
		cwd: repoDir,
		env: process.env,
		logStdout: true,
	});

	const serverProcess = fork(join(backendBuiltDir, 'entry.js'), [], {
		cwd: backendDir,
		env: {
			...process.env,
			NODE_ENV: 'production',
			MK_DISABLE_CLUSTERING: '1',
			MK_ONLY_SERVER: '1',
			MK_NO_DAEMONS: '1',
			MK_BACKEND_JS_FOOTPRINT_TRACE: traceFile,
		},
		stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
		execArgv: [
			'--require',
			join(__dirname, 'backend-js-footprint-require.cjs'),
			'--experimental-loader',
			pathToFileURL(join(__dirname, 'backend-js-footprint-loader.mjs')).href,
		],
	});

	serverProcess.stdout?.on('data', data => {
		process.stderr.write(`[server stdout] ${data}`);
	});

	serverProcess.stderr?.on('data', data => {
		process.stderr.write(`[server stderr] ${data}`);
	});

	serverProcess.on('error', err => {
		process.stderr.write(`[server error] ${err}\n`);
	});

	try {
		await waitForServerReady(serverProcess);
		await setTimeout(SETTLE_TIME);

		//const startup = summarizeRecords(await readTraceRecords(), 'startup');

		await Promise.all(
			Array.from({ length: REQUEST_COUNT }).map(() => createRequest()),
		);
		await setTimeout(1000);

		const afterRequest = summarizeRecords(await readTraceRecords(), 'afterRequest');

		return {
			timestamp: new Date().toISOString(),
			measurement: {
				strategy: 'runtime-loader-trace',
				startupTimeoutMs: STARTUP_TIMEOUT,
				settleTimeMs: SETTLE_TIME,
				requestCount: REQUEST_COUNT,
				cpus: cpus().length,
			},
			phases: {
				//startup,
				afterRequest,
			},
		};
	} finally {
		await stopServer(serverProcess);
		await fs.rm(traceFile, { force: true });
	}
}

const result = await measureFootprint();
await fs.writeFile(outputFile, `${JSON.stringify(result, null, 2)}\n`);

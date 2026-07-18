/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// NOTE: このファイルはworkflow上でバックエンドからも参照されるため、side effectがあってはならない

import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export function sleep(ms: number) {
	return new Promise(resolvePromise => setTimeout(resolvePromise, ms));
}

export function median(values: number[]) {
	const sorted = values.toSorted((a, b) => a - b);
	const center = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 1) return sorted[center];
	return Math.round((sorted[center - 1] + sorted[center]) / 2);
}

export function mad(values: number[]) {
	if (values.length < 2) throw new Error('Not enough samples to calculate MAD');

	const center = median(values);
	return median(values.map(value => Math.abs(value - center)));
}

function getSamplesByRound<T extends { round: number; }[]>(samples: T) {
	const samplesByRound = new Map<number, T[number]>();
	for (const sample of samples) {
		if (sample.round <= 0) continue;
		samplesByRound.set(sample.round, sample);
	}
	return samplesByRound;
}

export function pairedDeltaSummary<T extends { round: number; }[]>(baseSamples: T, headSamples: T, getValue: (sample: T[number]) => number | null) {
	const baseSamplesByRound = getSamplesByRound(baseSamples);
	const headSamplesByRound = getSamplesByRound(headSamples);
	const values = [];

	for (const [round, baseSample] of baseSamplesByRound) {
		const headSample = headSamplesByRound.get(round);
		if (headSample == null) continue;

		const baseValue = getValue(baseSample);
		const headValue = getValue(headSample);
		if (baseValue == null || headValue == null) continue;

		values.push(headValue - baseValue);
	}

	return {
		median: median(values),
		mad: mad(values),
		min: Math.min(...values),
		max: Math.max(...values),
		samples: values.length,
	};
}

export function normalizePath(filePath: string) {
	return filePath.split(path.sep).join('/');
}

export async function fileExists(filePath: string) {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

export async function fileSize(filePath: string) {
	const stat = await fs.stat(filePath);
	return stat.size;
}

export async function* traverseDirectory(dir: string): AsyncGenerator<string> {
	for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			yield* traverseDirectory(fullPath);
		} else if (entry.isFile()) {
			yield fullPath;
		}
	}
}

export function escapeLatex(text: string) {
	return text
		.replaceAll('\\', '\\\\')
		.replaceAll('{', '\\{')
		.replaceAll('}', '\\}')
		.replaceAll('%', '\\%');
}

export function escapeMdTableCell(value: string) {
	return String(value).replaceAll('|', '\\|').replaceAll('\n', '<br>');
}

export function formatMs(value: number | null | undefined) {
	if (value == null || !Number.isFinite(value)) return '-';
	if (value >= 1_000) return `${formatNumber(value / 1_000)} s`;
	return `${formatNumber(value)} ms`;
}

export function formatSecondsAsMs(value: number | null | undefined) {
	if (value == null || !Number.isFinite(value)) return '-';
	return formatMs(value * 1_000);
}

export function formatColoredDelta(delta: number, text: (value: number) => string, colorThreshold = 0) {
	if (delta === 0) return text(0);
	const sign = delta > 0 ? '+' : '-';
	if (Math.abs(delta) < colorThreshold) return `$\\text{${sign}${escapeLatex(text(Math.abs(delta)))}}$`;
	const color = delta > 0 ? 'orange' : 'green';
	return `$\\color{${color}}{\\text{${sign}${escapeLatex(text(Math.abs(delta)))}}}$`;
}

const numberFormatter = new Intl.NumberFormat('en-US', {
	maximumFractionDigits: 1,
});

export function formatNumber(value: number) {
	return numberFormatter.format(value);
}

export function formatBytes(value: number) {
	if (value === 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	let unitIndex = 0;
	let size = value;
	while (size >= 1000 && unitIndex < units.length - 1) {
		size /= 1000;
		unitIndex += 1;
	}

	const maximumFractionDigits = size >= 10 || unitIndex === 0 ? 0 : 1;
	return `${numberFormatter.format(Number(size.toFixed(maximumFractionDigits)))} ${units[unitIndex]}`;
}

export function calcAndFormatDeltaNumber(before: number, after: number, colorThreshold = 0) {
	if (before == null || after == null) return '-';
	const delta = after - before;
	return formatColoredDelta(delta, v => formatNumber(v), colorThreshold);
}

export function formatDeltaBytes(deltaBytes: number, colorThreshold = 0) {
	return formatColoredDelta(deltaBytes, v => formatBytes(v), colorThreshold);
}

export function calcAndFormatDeltaBytes(before: number, after: number, colorThreshold = 0) {
	if (before == null || after == null) return '-';
	const delta = after - before;
	return formatDeltaBytes(delta, colorThreshold);
}

export function formatPercent(value: number) {
	return `${formatNumber(value)}%`;
}

export function formatDeltaPercent(deltaPercent: number, colorThreshold = 0) {
	return formatColoredDelta(deltaPercent, v => formatPercent(v), colorThreshold);
}

export function calcAndFormatDeltaPercent(before: number, after: number, colorThreshold = 0) {
	if (before == null || before === 0 || after == null || after === 0) return '-';
	const delta = after - before;
	return formatDeltaPercent(delta / before * 100, colorThreshold);
}

export function commandName(command: string) {
	if (process.platform !== 'win32') return command;
	if (command === 'pnpm') return 'pnpm.cmd';
	return command;
}

export function readIntegerEnv(name: string, defaultValue: number, min: number) {
	const rawValue = process.env[name];
	if (rawValue == null || rawValue === '') return defaultValue;
	if (!/^\d+$/.test(rawValue)) throw new Error(`${name} must be an integer`);

	const value = Number(rawValue);
	if (!Number.isSafeInteger(value) || value < min) throw new Error(`${name} must be >= ${min}`);
	return value;
}

export function run(command: string, args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv; logStdout?: boolean } = {}) {
	return new Promise<string>((resolvePromise, reject) => {
		const child = spawn(commandName(command), args, {
			cwd: options.cwd,
			env: options.env,
			stdio: ['ignore', 'pipe', 'pipe'],
		});

		let stdout = '';
		let stderr = '';

		child.stdout.on('data', data => {
			stdout += data;
			if (options.logStdout) process.stderr.write(data);
		});

		child.stderr.on('data', data => {
			stderr += data;
			process.stderr.write(data);
		});

		child.on('error', reject);

		child.on('close', code => {
			if (code === 0) {
				resolvePromise(stdout);
			} else {
				reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}\n${stderr}`));
			}
		});
	});
}

export function startServer(label: string, repoDir: string) {
	process.stderr.write(`[${label}] Starting Misskey test server\n`);
	const child = spawn(commandName('pnpm'), ['start:test'], {
		cwd: repoDir,
		env: process.env,
		stdio: ['ignore', 'pipe', 'pipe'],
		detached: process.platform !== 'win32',
	});
	child.stdout.on('data', data => process.stderr.write(`[server:${label}] ${data}`));
	child.stderr.on('data', data => process.stderr.write(`[server:${label}] ${data}`));
	return child;
}

export async function waitForServer(baseUrl: string, child: ChildProcessWithoutNullStreams) {
	const startedAt = Date.now();
	while (Date.now() - startedAt < 120_000) {
		if (child.exitCode != null) throw new Error(`Misskey server exited early with code ${child.exitCode}`);
		try {
			const response = await fetch(`${baseUrl}/`, { redirect: 'manual' });
			if (response.status < 500) return;
		} catch {
			// retry
		}
		await sleep(1_000);
	}
	throw new Error(`Timed out waiting for ${baseUrl}`);
}

export async function api(baseUrl: string, endpoint: string, body: Record<string, unknown>) {
	const response = await fetch(`${baseUrl}/api/${endpoint}`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify(body),
	});
	if (!response.ok) {
		throw new Error(`/api/${endpoint} returned ${response.status}: ${await response.text()}`);
	}
	if (response.status === 204) return null;
	return await response.json();
}

export async function prepareInstance(baseUrl: string) {
	await api(baseUrl, 'reset-db', {});
	await api(baseUrl, 'admin/accounts/create', {
		username: 'admin',
		password: 'admin1234',
		setupPassword: 'example_password_please_change_this_or_you_will_get_hacked',
	});
}

export async function stopServer(child: ChildProcessWithoutNullStreams) {
	if (child.exitCode != null) return;

	if (process.platform === 'win32') {
		spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
	} else if (child.pid != null) {
		try {
			process.kill(-child.pid, 'SIGTERM');
		} catch {
			child.kill('SIGTERM');
		}
	}

	await new Promise<void>(resolvePromise => {
		if (child.exitCode != null) {
			resolvePromise();
			return;
		}
		child.once('exit', () => resolvePromise());
		setTimeout(() => {
			if (child.pid != null) {
				try {
					if (process.platform === 'win32') {
						spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
					} else {
						process.kill(-child.pid, 'SIGKILL');
					}
				} catch {
					child.kill('SIGKILL');
				}
			}
			resolvePromise();
		}, 10_000).unref();
	});
}

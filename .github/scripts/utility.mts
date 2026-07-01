/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// NOTE: このファイルはworkflow上でバックエンドからも参照されるため、side effectがあってはならない

import { spawn } from 'node:child_process';
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

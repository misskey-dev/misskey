/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs/promises';

export const procStatusKeys = ['VmPeak', 'VmSize', 'VmHWM', 'VmRSS', 'VmData', 'VmStk', 'VmExe', 'VmLib', 'VmPTE', 'VmSwap'] as const;
export const smapsRollupKeys = ['Pss', 'Shared_Clean', 'Shared_Dirty', 'Private_Clean', 'Private_Dirty', 'Swap', 'SwapPss'] as const;

/**
 * `/proc` 配下の `Key:  1234 kB` 形式のファイルから指定キーを取り出す。
 * 1つでも欠けていると以降の集計が静かに壊れるため、見つからなければ例外にする。
 */
export function parseMemoryFile<KS extends readonly string[]>(content: string, keys: KS, path: string): Record<KS[number], number> {
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

export function bytesToKiB(value: number) {
	return Math.round(value / 1024);
}

export async function getMemoryUsage(pid: number) {
	const path = `/proc/${pid}/status`;
	const status = await fs.readFile(path, 'utf-8');
	return parseMemoryFile(status, procStatusKeys, path);
}

export async function getSmapsRollupMemoryUsage(pid: number) {
	const path = `/proc/${pid}/smaps_rollup`;
	const smapsRollup = await fs.readFile(path, 'utf-8');
	return parseMemoryFile(smapsRollup, smapsRollupKeys, path);
}

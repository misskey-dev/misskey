/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Windows の `\` 区切りを `/` に揃える。manifest 側のキーが常に `/` 区切りのため、
 * 実ファイルパスと突き合わせる前に正規化する必要がある。
 */
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

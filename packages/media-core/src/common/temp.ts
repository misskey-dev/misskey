/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as tmp from 'tmp';

/**
 * 一時ファイルを作成する
 *
 * @returns [ファイルのパス, 削除する関数]
 */
export function createTemp(): Promise<[string, () => void]> {
	return new Promise((res, rej) => {
		tmp.file((e, path, _fd, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});
}

/**
 * 一時ディレクトリを作成する
 *
 * @returns [ディレクトリのパス, 中身ごと削除する関数]
 */
export function createTempDir(): Promise<[string, () => void]> {
	return new Promise((res, rej) => {
		tmp.dir({ unsafeCleanup: true }, (e, path, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});
}

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { contentDisposition } from './content-disposition.js';
import { correctFilename } from './correct-filename.js';
import type { IImageStreamable } from './image.js';

/**
 * プロキシの正常レスポンスに付与するヘッダーを作成する
 *
 * @param filename 元ファイルのファイル名 (拡張子は変換後の形式に合わせて補正される)
 * @param image レスポンスとして返す画像
 */
export function createProxyResponseHeaders(filename: string, image: Pick<IImageStreamable, 'ext' | 'type'>): Record<string, string> {
	return {
		'Content-Type': image.type,
		'Cache-Control': 'max-age=31536000, immutable',
		'Content-Disposition': contentDisposition('inline', correctFilename(filename, image.ext)),
	};
}

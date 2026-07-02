/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import type { Readable as NodeReadableStream } from 'node:stream';
import { FILE_TYPE_BROWSERSAFE } from '@/const.js';
import { contentDisposition } from '@/misc/content-disposition.js';
import type { IImageStreamable } from '@/core/ImageProcessingService.js';
import type { Context as HonoContext } from 'hono';

export type RangeStream = {
	stream: fs.ReadStream;
	start: number;
	end: number;
	chunksize: number;
};

/** Node FS Streamから、Web標準のReadableStreamに変換するユーティリティ */
export function nodeStreamToWebStream(stream: NodeReadableStream): ReadableStream<Uint8Array> {
	return new ReadableStream<Uint8Array>({
		start(controller) {
			stream.on('data', (chunk) => {
				controller.enqueue(new Uint8Array(typeof chunk === 'string' ? Buffer.from(chunk) : chunk));
			});
			stream.on('end', () => {
				controller.close();
			});
			stream.on('error', (err) => {
				controller.error(err);
			});
		},
	});
}

/** Bufferから、Web標準のReadableStreamに変換するユーティリティ */
export function bufferToWebStream(data: Buffer): ReadableStream<Uint8Array> {
	return new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(new Uint8Array(data));
			controller.close();
		},
	});
}

/**
 * Range リクエストに対応したストリームを作成する
 */
export function createRangeStream(rangeHeader: string, size: number, path: string): RangeStream {
	const parts = rangeHeader.replace(/bytes=/, '').split('-');
	const start = parseInt(parts[0], 10);
	let end = parts[1] ? parseInt(parts[1], 10) : size - 1;
	if (end > size) {
		end = size - 1;
	}
	const chunksize = end - start + 1;

	return {
		stream: fs.createReadStream(path, { start, end }),
		start,
		end,
		chunksize,
	};
}

/**
 * ストリームにcleanupハンドラを設定する
 * ストリームでない場合は即座にcleanupを実行する
 */
export function attachStreamCleanup(data: IImageStreamable['data'], cleanup: () => void): void {
	if ('pipe' in data && typeof data.pipe === 'function') {
		data.on('end', cleanup);
		data.on('close', cleanup);
	} else {
		cleanup();
	}
}

/**
 * MIME タイプがブラウザセーフかどうかに応じて Content-Type を返す
 */
export function getSafeContentType(mime: string): string {
	return FILE_TYPE_BROWSERSAFE.includes(mime) ? mime : 'application/octet-stream';
}

/**
 * Range リクエストを処理してストリームを返す
 * Range ヘッダーがない場合は通常のストリームを返す
 */
export function handleRangeRequest(
	ctx: HonoContext,
	size: number,
	path: string,
) {
	const rangeHeader = ctx.req.header('Range');
	if (rangeHeader && size > 0) {
		const { stream, start, end, chunksize } = createRangeStream(rangeHeader, size, path);
		ctx.header('Content-Range', `bytes ${start}-${end}/${size}`);
		ctx.header('Accept-Ranges', 'bytes');
		ctx.header('Content-Length', chunksize.toString());
		ctx.status(206);
		return stream;
	}
	return fs.createReadStream(path);
}

export type FileResponseOptions = {
	mime: string;
	filename: string;
	size?: number;
	cacheControl?: string;
};

/**
 * ファイルレスポンス用の共通ヘッダーを設定する
 */
export function setFileResponseHeaders(
	ctx: HonoContext,
	options: FileResponseOptions,
): void {
	ctx.header('Content-Type', getSafeContentType(options.mime));
	ctx.header('Cache-Control', options.cacheControl ?? 'max-age=31536000, immutable');
	ctx.header('Content-Disposition', contentDisposition('inline', options.filename));
	if (options.size !== undefined) {
		ctx.header('Content-Length', options.size.toString());
	}
}

/**
 * cleanup が必要なファイルかどうかを判定する型ガード
 */
export function needsCleanup<T extends { kind?: string; cleanup?: () => void }>(file: T): file is T & { cleanup: () => void } {
	return 'cleanup' in file && typeof file.cleanup === 'function';
}

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import { FILE_TYPE_BROWSERSAFE, getBaseMime as _getBaseMime } from '@/const.js';
export { getBaseMime, isBrowserSafeMime } from '@/const.js';
import { contentDisposition } from '@/misc/content-disposition.js';
import type { IImageStreamable } from '@/core/ImageProcessingService.js';
import type { FastifyReply } from 'fastify';

export type RangeStream = {
	stream: fs.ReadStream;
	start: number;
	end: number;
	chunksize: number;
};

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

// RFC 7231 の MIME token 相当の文字集合 (ヘッダインジェクション防止のため厳しめに制限)
const MIME_TOKEN_RE = /^[\w.+-]+$/;

/**
 * MIME タイプがブラウザセーフかどうかに応じて Content-Type を返す
 * - パラメータ (例: `; charset=utf-8`) が付いていてもベース MIME で判定する
 * - text/* で charset 未指定の場合は utf-8 を補う (iOS Safari 等の自動判定対策)
 *   ただし UTF-8 以外のテキストファイル (Shift_JIS 等) は依然として化ける可能性あり (既知の制約)
 * - パラメータ key/value は MIME token に合致しないものを捨て、ヘッダインジェクションを防ぐ
 */
export function getSafeContentType(mime: string): string {
	const segments = mime.split(';');
	const base = _getBaseMime(mime);
	if (!FILE_TYPE_BROWSERSAFE.includes(base)) return 'application/octet-stream';

	const params: string[] = [];
	let hasCharset = false;
	for (const seg of segments.slice(1)) {
		const eq = seg.indexOf('=');
		if (eq < 0) continue;
		const k = seg.slice(0, eq).trim().toLowerCase();
		let v = seg.slice(eq + 1).trim();
		// RFC 2045 の quoted-string (例: charset="utf-8") を受け入れる
		if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
		if (!MIME_TOKEN_RE.test(k) || !MIME_TOKEN_RE.test(v)) continue;
		if (k === 'charset') hasCharset = true;
		params.push(`${k}=${v}`);
	}
	if (base.startsWith('text/') && !hasCharset) params.push('charset=utf-8');

	return params.length > 0 ? `${base}; ${params.join('; ')}` : base;
}

/**
 * Content-Type と X-Content-Type-Options: nosniff を一緒に設定する
 * (text/plain などを inline 配信する経路で content sniffing による XSS を防ぐため)
 */
export function setSafeContentTypeHeader(reply: FastifyReply, mime: string): void {
	reply.header('Content-Type', getSafeContentType(mime));
	reply.header('X-Content-Type-Options', 'nosniff');
}

/**
 * Range リクエストを処理してストリームを返す
 * Range ヘッダーがない場合は通常のストリームを返す
 */
export function handleRangeRequest(
	reply: FastifyReply,
	rangeHeader: string | undefined,
	size: number,
	path: string,
): fs.ReadStream {
	if (rangeHeader && size > 0) {
		const { stream, start, end, chunksize } = createRangeStream(rangeHeader, size, path);
		reply.header('Content-Range', `bytes ${start}-${end}/${size}`);
		reply.header('Accept-Ranges', 'bytes');
		reply.header('Content-Length', chunksize);
		reply.code(206);
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
	reply: FastifyReply,
	options: FileResponseOptions,
): void {
	setSafeContentTypeHeader(reply, options.mime);
	reply.header('Cache-Control', options.cacheControl ?? 'max-age=31536000, immutable');
	reply.header('Content-Disposition', contentDisposition('inline', options.filename));
	if (options.size !== undefined) {
		reply.header('Content-Length', options.size);
	}
}

/**
 * cleanup が必要なファイルかどうかを判定する型ガード
 */
export function needsCleanup<T extends { kind?: string; cleanup?: () => void }>(file: T): file is T & { cleanup: () => void } {
	return 'cleanup' in file && typeof file.cleanup === 'function';
}

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as fileType from 'file-type';
import isSvg from 'is-svg';
import { fixMime } from './mime.js';

export type DetectedType = {
	mime: string;
	ext: string | null;
};

export const TYPE_OCTET_STREAM: DetectedType = {
	mime: 'application/octet-stream',
	ext: null,
};

export const TYPE_SVG: DetectedType = {
	mime: 'image/svg+xml',
	ext: 'svg',
};

export type DetectTypeOptions = {
	/**
	 * 動画として判定されたファイルが映像トラックを持つかを判定する。
	 * 省略時は映像トラックがあるものとして扱う（音声のみの mp4 / webm なども動画として判定される）
	 */
	hasVideoTrack?: (path: string) => Promise<boolean>;
};

/**
 * Detect MIME Type and extension
 */
export async function detectType(path: string, options: DetectTypeOptions = {}): Promise<DetectedType> {
	// Check 0 byte
	const fileSize = await getFileSize(path);
	if (fileSize === 0) {
		return TYPE_OCTET_STREAM;
	}

	const type = await fileType.fileTypeFromFile(path);

	if (type) {
		// XMLはSVGかもしれない
		if (type.mime === 'application/xml' && await checkSvg(path)) {
			return TYPE_SVG;
		}

		if ((type.mime.startsWith('video') || type.mime === 'application/ogg') && options.hasVideoTrack != null && !(await options.hasVideoTrack(path))) {
			const newMime = `audio/${type.mime.split('/')[1]}`;
			if (newMime === 'audio/mp4') {
				return {
					mime: 'audio/mp4',
					ext: 'm4a',
				};
			}
			return {
				mime: newMime,
				ext: type.ext,
			};
		}

		return {
			mime: fixMime(type.mime),
			ext: type.ext,
		};
	}

	// 種類が不明でもSVGかもしれない
	if (await checkSvg(path)) {
		return TYPE_SVG;
	}

	// それでも種類が不明なら application/octet-stream にする
	return TYPE_OCTET_STREAM;
}

/**
 * Check the file is SVG or not
 */
export async function checkSvg(path: string): Promise<boolean> {
	try {
		const size = await getFileSize(path);
		if (size > 1 * 1024 * 1024) return false;
		const buffer = await fs.promises.readFile(path);
		return isSvg(buffer.toString());
	} catch {
		return false;
	}
}

/**
 * Get file size
 */
export async function getFileSize(path: string): Promise<number> {
	return (await fs.promises.stat(path)).size;
}

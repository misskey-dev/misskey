/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FILE_TYPE_BROWSERSAFE } from '@@/js/const.js';

export function isPreviewable(mime: string): boolean {
	if (mime === 'image/svg+xml') return true; // svgのwebpublic/thumbnailはpngなのでtrue
	// FILE_TYPE_BROWSERSAFEに適合しないものはブラウザで表示するのに不適切
	return (mime.startsWith('image') || mime.startsWith('video') || mime.startsWith('audio')) && !FILE_TYPE_BROWSERSAFE.includes(mime);
}

export function getType(mime: string): 'image' | 'video' | 'audio' {
	if (mime.startsWith('image')) return 'image';
	if (mime.startsWith('video')) return 'video';
	if (mime.startsWith('audio')) return 'audio';
	throw new Error(`Unsupported file type: ${mime}`);
}

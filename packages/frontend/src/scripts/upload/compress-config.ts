/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import isAnimated from 'is-file-animated';
import { isWebpSupported } from './isWebpSupported';
import type { BrowserImageResizerConfig } from 'browser-image-resizer';
import { defaultStore } from '@/store';

const compressTypeMap = {
	'lossy': { quality: 0.90, mimeType: 'image/webp' },
	'lossless': { quality: 1, mimeType: 'image/webp' },
} as const;

const compressTypeMapFallback = {
	'lossy': { quality: 0.85, mimeType: 'image/jpeg' },
	'lossless': { quality: 1, mimeType: 'image/png' },
} as const;

const inputCompressKindMap = {
	'image/jpeg': 'lossy',
	'image/png': 'lossless',
	'image/webp': 'lossy',
	'image/svg+xml': 'lossless',
} as const;

const resizeSizeConfig = { maxWidth: 2048, maxHeight: 2048 } as const;
const noResizeSizeConfig = { maxWidth: Number.MAX_SAFE_INTEGER, maxHeight: Number.MAX_SAFE_INTEGER } as const;

async function isLosslessWebp(file: Blob): Promise<boolean> {
	// file header
	//   'RIFF': u32 @ 0x00
	//   file size: u32 @ 0x04
	//   'WEBP': u32 @ 0x08
	// for simple lossless
	//   'VP8L': u32 @ 0x0C
	// so read 16 bytes and check those three magic numbers
	const buffer = new Uint8Array(await file.slice(0, 16).arrayBuffer());

	const header = 'RIFF\x00\x00\x00\x00WEBPVP8L';
	for (let i = 0; i < header.length; i++) {
		const code = header.charCodeAt(i);
		if (code === 0) continue;
		if (buffer[i] !== code) return false;
	}
	return true;
}

async function inputImageKind(file: File): Promise<'lossy' | 'lossless' | undefined> {
	let compressKind: 'lossy' | 'lossless' | undefined = inputCompressKindMap[file.type];
	if (!compressKind) return undefined; // unknown image format
	if (await isAnimated(file)) return undefined; // animated image format
	// WEBPs can be lossless
	if (await isLosslessWebp(file)) compressKind = 'lossless';
	return compressKind;
}

export async function getCompressionConfig(file: File): Promise<BrowserImageResizerConfig | undefined> {
	const inputCompressKind = await inputImageKind(file);
	if (!inputCompressKind) return undefined;

	let compressKind: 'lossy' | 'lossless';
	let resize: boolean;

	switch (defaultStore.state.imageCompressionMode) {
		case 'resizeCompress':
		case null:
		default:
			resize = true;
			compressKind = inputCompressKind;
			break;
		case 'noResizeCompress':
			resize = false;
			compressKind = inputCompressKind;
			break;
		case 'resizeCompressLossy':
			resize = true;
			compressKind = 'lossy';
			break;
		case 'noResizeCompressLossy':
			resize = false;
			compressKind = 'lossy';
			break;
	}

	const webpSupported = isWebpSupported();

	const imgFormatConfig = (webpSupported ? compressTypeMap : compressTypeMapFallback)[compressKind];
	const sizeConfig = resize ? resizeSizeConfig : noResizeSizeConfig;

	if (!resize) {
		// we don't resize images so we may omit recompression
		if (imgFormatConfig.mimeType === file.type && inputCompressKind === compressKind) {
			// we don't have to recompress already compressed to preferred image format.
			return undefined;
		}

		if (!webpSupported && file.type === 'image/webp' && compressKind === 'lossless') {
			// lossless webp -> png recompression likely to increase image size so don't recompress
			return undefined;
		}
	}

	return {
		debug: true,
		...imgFormatConfig,
		...sizeConfig,
	};
}

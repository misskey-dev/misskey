/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import isAnimated from 'is-file-animated';
import { isWebpSupported } from './isWebpSupported.js';
import type { BrowserImageResizerConfigWithConvertedOutput } from '@misskey-dev/browser-image-resizer';

const supportedTypes = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/svg+xml',
] as const;

export async function getCompressionConfig(file: File, options: Partial<{ maxWidth: number; maxHeight: number; }> = {}): Promise<BrowserImageResizerConfigWithConvertedOutput | undefined> {
	if (!supportedTypes.includes(file.type) || await isAnimated(file)) {
		return;
	}

	return {
		mimeType: isWebpSupported() ? 'image/webp' : 'image/jpeg',
		maxWidth: options.maxWidth ?? 2048,
		maxHeight: options.maxHeight ?? 2048,
		quality: isWebpSupported() ? 0.9 : 0.85,
		debug: true,
	};
}

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { sharpBmp } from '@misskey-dev/sharp-read-bmp';
import * as blurhash from 'blurhash';

/**
 * Calculate blurhash string of image
 */
export async function getBlurhash(path: string, type: string): Promise<string> {
	const sharp = await sharpBmp(path, type);
	const { data: buffer, info } = await sharp
		.raw()
		.ensureAlpha()
		.resize(64, 64, { fit: 'inside' })
		.toBuffer({ resolveWithObject: true });
	return blurhash.encode(new Uint8ClampedArray(buffer), info.width, info.height, 5, 5);
}

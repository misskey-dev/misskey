/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import probeImageSize from 'probe-image-size';

export type ImageSize = {
	width: number;
	height: number;
	wUnits: string;
	hUnits: string;
	orientation?: number;
};

/**
 * Detect dimensions of image
 */
export async function detectImageSize(path: string): Promise<ImageSize> {
	const readable = fs.createReadStream(path);
	const imageSize = await probeImageSize(readable);
	readable.destroy();
	return imageSize;
}

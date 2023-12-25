/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FILE_TYPE_BROWSERSAFE } from '@/const.js';

const dictionary = {
	'safe-file': FILE_TYPE_BROWSERSAFE,
	'sharp-convertible-image': ['image/jpeg', 'image/tiff', 'image/png', 'image/gif', 'image/apng', 'image/vnd.mozilla.apng', 'image/webp', 'image/avif', 'image/svg+xml'],
	'sharp-animation-convertible-image': ['image/jpeg', 'image/tiff', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml'],
	'sharp-convertible-image-with-bmp': ['image/jpeg', 'image/tiff', 'image/png', 'image/gif', 'image/apng', 'image/vnd.mozilla.apng', 'image/webp', 'image/avif', 'image/svg+xml', 'image/x-icon', 'image/bmp'],
	'sharp-animation-convertible-image-with-bmp': ['image/jpeg', 'image/tiff', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml', 'image/x-icon', 'image/bmp'],
};

export const isMimeImage = (mime: string, type: keyof typeof dictionary): boolean => dictionary[type].includes(mime);

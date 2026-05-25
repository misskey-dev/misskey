/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { clippedPicture } from './clippedPicture.js';
import { i18n } from '@/i18n.js';

export const clippedPicture_ui = defineObjectUi<typeof clippedPicture>({
	name: i18n.ts._miRoom._objects.clippedPicture,
	options: {
		width: {
			label: i18n.ts._miRoom._objects._clippedPicture.width,
		},
		height: {
			label: i18n.ts._miRoom._objects._clippedPicture.height,
		},
		image: {
			label: i18n.ts._miRoom._objects._clippedPicture.image,
		},
	},
});

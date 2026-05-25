/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { wallMirror } from './wallMirror.js';
import { i18n } from '@/i18n.js';

export const wallMirror_ui = defineObjectUi<typeof wallMirror>({
	name: i18n.ts._miRoom._objects.wallMirror,
	options: {
		width: {
			label: i18n.ts._miRoom._objects._wallMirror.width,
		},
		height: {
			label: i18n.ts._miRoom._objects._wallMirror.height,
		},
		frameThickness: {
			label: i18n.ts._miRoom._objects._wallMirror.frameThickness,
		},
		frameMat: {
			label: i18n.ts._miRoom._objects._wallMirror.frameMat,
		},
	},
});

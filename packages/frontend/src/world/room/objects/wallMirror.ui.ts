/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { wallMirror_schema } from 'misskey-world/src/room/objects/wallMirror.schema.js';
import { i18n } from '@/i18n.js';

export const wallMirror_ui = defineFunitureUi<typeof wallMirror_schema>({
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

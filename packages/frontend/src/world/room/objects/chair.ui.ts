/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { chair_schema } from 'misskey-world/src/room/objects/chair.schema.js';
import { i18n } from '@/i18n.js';

export const chair_ui = defineFunitureUi<typeof chair_schema>({
	name: i18n.ts._miRoom._objects.chair,
	options: {
		primaryMat: {
			label: i18n.ts._miRoom._objects._chair.primaryMat,
		},
		secondaryMat: {
			label: i18n.ts._miRoom._objects._chair.secondaryMat,
		},
		frameMat: {
			label: i18n.ts._miRoom._objects._chair.frameMat,
		},
	},
});

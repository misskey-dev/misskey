/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { chair } from './chair.js';
import { i18n } from '@/i18n.js';

export const chair_ui = defineObjectUi<typeof chair>({
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

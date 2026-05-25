/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { bed } from './bed.js';
import { i18n } from '@/i18n.js';

export const bed_ui = defineObjectUi<typeof bed>({
	name: i18n.ts._miRoom._objects.bed,
	options: {
		frameMat: {
			label: i18n.ts._miRoom._objects._bed.frameMat,
		},
	},
});

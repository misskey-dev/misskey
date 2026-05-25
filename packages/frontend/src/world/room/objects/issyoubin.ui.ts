/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { issyoubin } from './issyoubin.js';
import { i18n } from '@/i18n.js';

export const issyoubin_ui = defineObjectUi<typeof issyoubin>({
	name: i18n.ts._miRoom._objects.issyoubin,
	options: {
		variation: {
			label: i18n.ts._miRoom._objects._issyoubin.variation,
			enum: {
				'misuki': {
					label: 'A',
				},
				'ai': {
					label: 'B',
				},
			},
		},
	},
});

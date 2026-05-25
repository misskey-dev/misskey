/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { piano } from './piano.js';
import { i18n } from '@/i18n.js';

export const piano_ui = defineObjectUi<typeof piano>({
	name: i18n.ts._miRoom._objects.piano,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._piano.bodyMat,
		},
	},
});

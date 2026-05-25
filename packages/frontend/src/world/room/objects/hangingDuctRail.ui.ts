/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { hangingDuctRail } from './hangingDuctRail.js';
import { i18n } from '@/i18n.js';

export const hangingDuctRail_ui = defineObjectUi<typeof hangingDuctRail>({
	name: i18n.ts._miRoom._objects.hangingDuctRail,
	options: {
		width: {
			label: i18n.ts._miRoom._objects._hangingDuctRail.width,
		},
		height: {
			label: i18n.ts._miRoom._objects._hangingDuctRail.height,
		},
		bodyMat: {
			label: i18n.ts._miRoom._objects._hangingDuctRail.bodyMat,
		},
	},
});

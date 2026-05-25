/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { stanchionPole } from './stanchionPole.js';
import { i18n } from '@/i18n.js';

export const stanchionPole_ui = defineObjectUi<typeof stanchionPole>({
	name: i18n.ts._miRoom._objects.stanchionPole,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._stanchionPole.bodyMat,
		},
		ropeMat: {
			label: i18n.ts._miRoom._objects._stanchionPole.ropeMat,
		},
	},
});

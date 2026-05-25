/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { pachira } from './pachira.js';
import { i18n } from '@/i18n.js';

export const pachira_ui = defineObjectUi<typeof pachira>({
	name: i18n.ts._miRoom._objects.pachira,
	options: {
		potMat: {
			label: i18n.ts._miRoom._objects._pachira.potMat,
		},
	},
});

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { a4Case } from './a4Case.js';
import { i18n } from '@/i18n.js';

export const a4Case_ui = defineObjectUi<typeof a4Case>({
	name: i18n.ts._miRoom._objects.a4Case,
	options: {
		mat: {
			label: i18n.ts._miRoom._objects._a4Case.mat,
		},
	},
});

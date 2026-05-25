/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { monstera } from './monstera.js';
import { i18n } from '@/i18n.js';

export const monstera_ui = defineObjectUi<typeof monstera>({
	name: i18n.ts._miRoom._objects.monstera,
	options: {
		potMat: {
			label: i18n.ts._miRoom._objects._monstera.potMat,
		},
	},
});

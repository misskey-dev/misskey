/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { cactusS } from './cactusS.js';
import { i18n } from '@/i18n.js';

export const cactusS_ui = defineObjectUi<typeof cactusS>({
	name: i18n.ts._miRoom._objects.cactusS,
	options: {
		potMat: {
			label: i18n.ts._miRoom._objects._cactusS.potMat,
		},
	},
});

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { ceilingFanLight_schema } from './ceilingFanLight.schema.js';
import { i18n } from '@/i18n.js';

export const ceilingFanLight_ui = defineObjectUi<typeof ceilingFanLight_schema>({
	name: i18n.ts._miRoom._objects.ceilingFanLight,
	options: {
		shadeMat: {
			label: i18n.ts._miRoom._objects._ceilingFanLight.shadeMat,
		},
	},
});

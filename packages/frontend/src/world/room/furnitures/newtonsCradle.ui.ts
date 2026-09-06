/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { newtonsCradle_schema } from 'misskey-world/src/room/furnitures/newtonsCradle.schema.js';
import { i18n } from '@/i18n.js';

export const newtonsCradle_ui = defineFurnitureUi<typeof newtonsCradle_schema>({
	name: i18n.ts._miRoom._furnitures.newtonsCradle,
	options: {
		frameMat: {
			label: i18n.ts._miRoom._furnitures._newtonsCradle.frameMat,
		},
	},
});

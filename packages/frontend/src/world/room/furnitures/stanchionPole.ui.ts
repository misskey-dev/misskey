/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { stanchionPole_schema } from 'misskey-world/src/room/furnitures/stanchionPole.schema.js';
import { i18n } from '@/i18n.js';

export const stanchionPole_ui = defineFurnitureUi<typeof stanchionPole_schema>({
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

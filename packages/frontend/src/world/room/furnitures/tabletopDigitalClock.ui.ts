/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { tabletopDigitalClock_schema } from 'misskey-world/src/room/furnitures/tabletopDigitalClock.schema.js';
import { i18n } from '@/i18n.js';

export const tabletopDigitalClock_ui = defineFurnitureUi<typeof tabletopDigitalClock_schema>({
	name: i18n.ts._miRoom._objects.tabletopDigitalClock,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._tabletopDigitalClock.bodyMat,
		},
		lcdColor: {
			label: i18n.ts._miRoom._objects._tabletopDigitalClock.lcdColor,
		},
	},
});

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { monitor_schema } from 'misskey-world/src/room/furnitures/monitor.schema.js';
import { i18n } from '@/i18n.js';

export const monitor_ui = defineFurnitureUi<typeof monitor_schema>({
	name: i18n.ts._miRoom._furnitures.monitor,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._furnitures._monitor.bodyMat,
		},
		screenBrightness: {
			label: i18n.ts._miRoom._furnitures._monitor.screenBrightness,
		},
		image: {
			label: i18n.ts._miRoom._furnitures._monitor.image,
		},
	},
});

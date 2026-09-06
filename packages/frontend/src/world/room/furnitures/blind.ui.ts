/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { blind_schema } from 'misskey-world/src/room/furnitures/blind.schema.js';
import { i18n } from '@/i18n.js';

export const blind_ui = defineFurnitureUi<typeof blind_schema>({
	name: i18n.ts._miRoom._furnitures.blind,
	options: {
		blades: {
			label: i18n.ts._miRoom._furnitures._blind.blades,
		},
		angle: {
			label: i18n.ts._miRoom._furnitures._blind.angle,
		},
		open: {
			label: i18n.ts._miRoom._furnitures._blind.open,
		},
	},
});

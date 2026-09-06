/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { icosahedron_schema } from 'misskey-world/src/room/furnitures/icosahedron.schema.js';
import { i18n } from '@/i18n.js';

export const icosahedron_ui = defineFurnitureUi<typeof icosahedron_schema>({
	name: i18n.ts._miRoom._furnitures.icosahedron,
	options: {
		mat: {
			label: i18n.ts._miRoom._furnitures._icosahedron.mat,
		},
	},
});

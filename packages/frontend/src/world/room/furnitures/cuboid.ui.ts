/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { cuboid_schema } from 'misskey-world/src/room/furnitures/cuboid.schema.js';
import { i18n } from '@/i18n.js';

export const cuboid_ui = defineFurnitureUi<typeof cuboid_schema>({
	name: i18n.ts._miRoom._furnitures.cuboid,
	options: {
		x: {
			label: i18n.ts._miRoom._furnitures._cuboid.x,
		},
		y: {
			label: i18n.ts._miRoom._furnitures._cuboid.y,
		},
		z: {
			label: i18n.ts._miRoom._furnitures._cuboid.z,
		},
		mat: {
			label: i18n.ts._miRoom._furnitures._cuboid.mat,
		},
	},
});

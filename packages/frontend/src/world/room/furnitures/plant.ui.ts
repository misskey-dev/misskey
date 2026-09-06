/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { plant_schema } from 'misskey-world/src/room/furnitures/plant.schema.js';
import { i18n } from '@/i18n.js';

export const plant_ui = defineFurnitureUi<typeof plant_schema>({
	name: i18n.ts._miRoom._furnitures.plant,
	options: {},
});

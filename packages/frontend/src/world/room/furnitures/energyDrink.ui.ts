/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { energyDrink_schema } from 'misskey-world/src/room/furnitures/energyDrink.schema.js';
import { i18n } from '@/i18n.js';

export const energyDrink_ui = defineFurnitureUi<typeof energyDrink_schema>({
	name: i18n.ts._miRoom._objects.energyDrink,
	options: {},
});

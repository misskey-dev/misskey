/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { pizza_schema } from 'misskey-world/src/room/furnitures/pizza.schema.js';
import { i18n } from '@/i18n.js';

export const pizza_ui = defineFurnitureUi<typeof pizza_schema>({
	name: i18n.ts._miRoom._furnitures.pizza,
	options: {},
});

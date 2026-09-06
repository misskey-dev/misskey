/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { coffeeCup_schema } from 'misskey-world/src/room/furnitures/coffeeCup.schema.js';
import { i18n } from '@/i18n.js';

export const coffeeCup_ui = defineFurnitureUi<typeof coffeeCup_schema>({
	name: i18n.ts._miRoom._furnitures.coffeeCup,
	options: {},
});

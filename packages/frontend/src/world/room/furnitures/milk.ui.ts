/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { milk_schema } from 'misskey-world/src/room/furnitures/milk.schema.js';
import { i18n } from '@/i18n.js';

export const milk_ui = defineFurnitureUi<typeof milk_schema>({
	name: i18n.ts._miRoom._objects.milk,
	options: {},
});

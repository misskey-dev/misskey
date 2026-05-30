/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { miPlateDisplayed_schema } from 'misskey-world/src/room/furnitures/miPlateDisplayed.schema.js';
import { i18n } from '@/i18n.js';

export const miPlateDisplayed_ui = defineFurnitureUi<typeof miPlateDisplayed_schema>({
	name: i18n.ts._miRoom._objects.miPlateDisplayed,
	options: {},
});

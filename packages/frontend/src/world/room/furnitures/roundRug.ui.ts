/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { roundRug_schema } from 'misskey-world/src/room/furnitures/roundRug.schema.js';
import { i18n } from '@/i18n.js';

export const roundRug_ui = defineFurnitureUi<typeof roundRug_schema>({
	name: i18n.ts._miRoom._objects.roundRug,
	options: {},
});

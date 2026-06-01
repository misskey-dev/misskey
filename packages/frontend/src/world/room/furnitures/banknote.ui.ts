/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { banknote_schema } from 'misskey-world/src/room/furnitures/banknote.schema.js';
import { i18n } from '@/i18n.js';

export const banknote_ui = defineFurnitureUi<typeof banknote_schema>({
	name: i18n.ts._miRoom._furnitures.banknote,
	options: {},
});

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { tetrapod_schema } from 'misskey-world/src/room/furnitures/tetrapod.schema.js';
import { i18n } from '@/i18n.js';

export const tetrapod_ui = defineFurnitureUi<typeof tetrapod_schema>({
	name: i18n.ts._miRoom._furnitures.tetrapod,
	options: {},
});

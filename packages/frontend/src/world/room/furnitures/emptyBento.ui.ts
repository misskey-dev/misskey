/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { emptyBento_schema } from 'misskey-world/src/room/furnitures/emptyBento.schema.js';
import { i18n } from '@/i18n.js';

export const emptyBento_ui = defineFurnitureUi<typeof emptyBento_schema>({
	name: i18n.ts._miRoom._furnitures.emptyBento,
	options: {},
});

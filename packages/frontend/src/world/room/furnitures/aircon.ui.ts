/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { aircon_schema } from 'misskey-world/src/room/furnitures/aircon.schema.js';
import { i18n } from '@/i18n.js';

export const aircon_ui = defineFurnitureUi<typeof aircon_schema>({
	name: i18n.ts._miRoom._objects.aircon,
	options: {},
});

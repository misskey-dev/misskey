/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { siphon_schema } from 'misskey-world/src/room/furnitures/siphon.schema.js';
import { i18n } from '@/i18n.js';

export const siphon_ui = defineFurnitureUi<typeof siphon_schema>({
	name: i18n.ts._miRoom._objects.siphon,
	options: {},
});

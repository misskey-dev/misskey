/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { miObjet_schema } from 'misskey-world/src/room/furnitures/miObjet.schema.js';
import { i18n } from '@/i18n.js';

export const miObjet_ui = defineFurnitureUi<typeof miObjet_schema>({
	name: i18n.ts._miRoom._objects.miObjet,
	options: {},
});

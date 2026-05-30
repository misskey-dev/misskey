/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { miObjet_schema } from 'misskey-world/src/room/objects/miObjet.schema.js';
import { i18n } from '@/i18n.js';

export const miObjet_ui = defineFunitureUi<typeof miObjet_schema>({
	name: i18n.ts._miRoom._objects.miObjet,
	options: {},
});

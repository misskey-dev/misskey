/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { miObjet_schema } from './mi-objet.schema.js';
import { i18n } from '@/i18n.js';

export const miObjet_ui = defineObjectUi<typeof miObjet_schema>({
	name: i18n.ts._miRoom._objects.miObjet,
	options: {},
});

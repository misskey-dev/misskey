/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { banknote_schema } from 'misskey-world/src/room/objects/banknote.schema.js';
import { i18n } from '@/i18n.js';

export const banknote_ui = defineFunitureUi<typeof banknote_schema>({
	name: i18n.ts._miRoom._objects.banknote,
	options: {},
});

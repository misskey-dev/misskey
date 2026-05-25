/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { banknote_schema } from './banknote.schema.js';
import { i18n } from '@/i18n.js';

export const banknote_ui = defineObjectUi<typeof banknote_schema>({
	name: i18n.ts._miRoom._objects.banknote,
	options: {},
});

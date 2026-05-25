/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { banknote } from './banknote.js';
import { i18n } from '@/i18n.js';

export const banknote_ui = defineObjectUi<typeof banknote>({
	name: i18n.ts._miRoom._objects.banknote,
	options: {},
});

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { hangingTShirt } from './hangingTShirt.js';
import { i18n } from '@/i18n.js';

export const hangingTShirt_ui = defineObjectUi<typeof hangingTShirt>({
	name: i18n.ts._miRoom._objects.hangingTShirt,
	options: {},
});

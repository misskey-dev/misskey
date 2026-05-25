/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { milk } from './milk.js';
import { i18n } from '@/i18n.js';

export const milk_ui = defineObjectUi<typeof milk>({
	name: i18n.ts._miRoom._objects.milk,
	options: {},
});

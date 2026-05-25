/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { coffeeCup } from './coffeeCup.js';
import { i18n } from '@/i18n.js';

export const coffeeCup_ui = defineObjectUi<typeof coffeeCup>({
	name: i18n.ts._miRoom._objects.coffeeCup,
	options: {},
});

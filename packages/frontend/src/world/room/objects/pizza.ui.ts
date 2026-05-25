/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { pizza } from './pizza.js';
import { i18n } from '@/i18n.js';

export const pizza_ui = defineObjectUi<typeof pizza>({
	name: i18n.ts._miRoom._objects.pizza,
	options: {},
});

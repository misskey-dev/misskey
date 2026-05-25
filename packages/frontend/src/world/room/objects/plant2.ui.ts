/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { plant2 } from './plant2.js';
import { i18n } from '@/i18n.js';

export const plant2_ui = defineObjectUi<typeof plant2>({
	name: i18n.ts._miRoom._objects.plant2,
	options: {},
});

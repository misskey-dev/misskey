/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { roundRug } from './roundRug.js';
import { i18n } from '@/i18n.js';

export const roundRug_ui = defineObjectUi<typeof roundRug>({
	name: i18n.ts._miRoom._objects.roundRug,
	options: {},
});

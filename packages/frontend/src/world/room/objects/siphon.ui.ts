/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { siphon } from './siphon.js';
import { i18n } from '@/i18n.js';

export const siphon_ui = defineObjectUi<typeof siphon>({
	name: i18n.ts._miRoom._objects.siphon,
	options: {},
});

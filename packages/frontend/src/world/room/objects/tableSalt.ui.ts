/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { tableSalt } from './tableSalt.js';
import { i18n } from '@/i18n.js';

export const tableSalt_ui = defineObjectUi<typeof tableSalt>({
	name: i18n.ts._miRoom._objects.tableSalt,
	options: {},
});

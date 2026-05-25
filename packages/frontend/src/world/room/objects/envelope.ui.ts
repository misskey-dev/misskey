/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { envelope } from './envelope.js';
import { i18n } from '@/i18n.js';

export const envelope_ui = defineObjectUi<typeof envelope>({
	name: i18n.ts._miRoom._objects.envelope,
	options: {},
});

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { recordPlayer_schema } from './recordPlayer.schema.js';
import { i18n } from '@/i18n.js';

export const recordPlayer_ui = defineObjectUi<typeof recordPlayer_schema>({
	name: i18n.ts._miRoom._objects.recordPlayer,
	options: {},
});

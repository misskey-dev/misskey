/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { recordPlayer_schema } from 'misskey-world/src/room/objects/recordPlayer.schema.js';
import { i18n } from '@/i18n.js';

export const recordPlayer_ui = defineFunitureUi<typeof recordPlayer_schema>({
	name: i18n.ts._miRoom._objects.recordPlayer,
	options: {},
});

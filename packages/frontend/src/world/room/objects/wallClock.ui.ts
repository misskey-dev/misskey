/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { wallClock_schema } from 'misskey-world/src/room/objects/wallClock.schema.js';
import { i18n } from '@/i18n.js';

export const wallClock_ui = defineFunitureUi<typeof wallClock_schema>({
	name: i18n.ts._miRoom._objects.wallClock,
	options: {
		frameMat: {
			label: i18n.ts._miRoom._objects._wallClock.frameMat,
		},
	},
});

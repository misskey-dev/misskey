/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { bed_schema } from 'misskey-world/src/room/objects/bed.schema.js';
import { i18n } from '@/i18n.js';

export const bed_ui = defineFunitureUi<typeof bed_schema>({
	name: i18n.ts._miRoom._objects.bed,
	options: {
		frameMat: {
			label: i18n.ts._miRoom._objects._bed.frameMat,
		},
	},
});

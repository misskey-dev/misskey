/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { hangingDuctRail_schema } from 'misskey-world/src/room/objects/hangingDuctRail.schema.js';
import { i18n } from '@/i18n.js';

export const hangingDuctRail_ui = defineFunitureUi<typeof hangingDuctRail_schema>({
	name: i18n.ts._miRoom._objects.hangingDuctRail,
	options: {
		width: {
			label: i18n.ts._miRoom._objects._hangingDuctRail.width,
		},
		height: {
			label: i18n.ts._miRoom._objects._hangingDuctRail.height,
		},
		bodyMat: {
			label: i18n.ts._miRoom._objects._hangingDuctRail.bodyMat,
		},
	},
});

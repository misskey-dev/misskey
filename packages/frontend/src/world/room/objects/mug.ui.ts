/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { mug_schema } from 'misskey-world/src/room/objects/mug.schema.js';
import { i18n } from '@/i18n.js';

export const mug_ui = defineFunitureUi<typeof mug_schema>({
	name: i18n.ts._miRoom._objects.mug,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._mug.bodyMat,
		},
		liquidMat: {
			label: i18n.ts._miRoom._objects._mug.liquidMat,
		},
	},
});

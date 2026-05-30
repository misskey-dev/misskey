/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { colorBox_schema } from 'misskey-world/src/room/objects/colorBox.schema.js';
import { i18n } from '@/i18n.js';

export const colorBox_ui = defineFunitureUi<typeof colorBox_schema>({
	name: i18n.ts._miRoom._objects.colorBox,
	options: {
		mat: {
			label: i18n.ts._miRoom._objects._colorBox.mat,
		},
	},
});

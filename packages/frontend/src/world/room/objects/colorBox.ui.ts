/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { colorBox } from './colorBox.js';
import { i18n } from '@/i18n.js';

export const colorBox_ui = defineObjectUi<typeof colorBox>({
	name: i18n.ts._miRoom._objects.colorBox,
	options: {
		mat: {
			label: i18n.ts._miRoom._objects._colorBox.mat,
		},
	},
});

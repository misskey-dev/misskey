/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { handheldGameConsole } from './handheldGameConsole.js';
import { i18n } from '@/i18n.js';

export const handheldGameConsole_ui = defineObjectUi<typeof handheldGameConsole>({
	name: i18n.ts._miRoom._objects.handheldGameConsole,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._handheldGameConsole.bodyMat,
		},
		screenBrightness: {
			label: i18n.ts._miRoom._objects._handheldGameConsole.screenBrightness,
		},
		image: {
			label: i18n.ts._miRoom._objects._handheldGameConsole.image,
		},
	},
});

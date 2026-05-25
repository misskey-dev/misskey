/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { largeMousepad } from './largeMousepad.js';
import { i18n } from '@/i18n.js';

export const largeMousepad_ui = defineObjectUi<typeof largeMousepad>({
	name: i18n.ts._miRoom._objects.largeMousepad,
	options: {
		image: {
			label: i18n.ts._miRoom._objects._largeMousepad.image,
		},
	},
});

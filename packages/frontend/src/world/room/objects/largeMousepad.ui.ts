/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { largeMousepad_schema } from './largeMousepad.schema.js';
import { i18n } from '@/i18n.js';

export const largeMousepad_ui = defineObjectUi<typeof largeMousepad_schema>({
	name: i18n.ts._miRoom._objects.largeMousepad,
	options: {
		image: {
			label: i18n.ts._miRoom._objects._largeMousepad.image,
		},
	},
});

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { tabletopFlag_schema } from './tabletopFlag.schema.js';
import { i18n } from '@/i18n.js';

export const tabletopFlag_ui = defineObjectUi<typeof tabletopFlag_schema>({
	name: i18n.ts._miRoom._objects.tabletopFlag,
	options: {
		image: {
			label: i18n.ts._miRoom._objects._tabletopFlag.image,
		},
	},
});

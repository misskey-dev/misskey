/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { blind_schema } from 'misskey-world/src/room/objects/blind.schema.js';
import { i18n } from '@/i18n.js';

export const blind_ui = defineObjectUi<typeof blind_schema>({
	name: i18n.ts._miRoom._objects.blind,
	options: {
		blades: {
			label: i18n.ts._miRoom._objects._blind.blades,
		},
		angle: {
			label: i18n.ts._miRoom._objects._blind.angle,
		},
		open: {
			label: i18n.ts._miRoom._objects._blind.open,
		},
	},
});

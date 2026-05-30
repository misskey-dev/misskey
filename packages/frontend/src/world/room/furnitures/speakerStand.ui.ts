/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { speakerStand_schema } from 'misskey-world/src/room/furnitures/speakerStand.schema.js';
import { i18n } from '@/i18n.js';

export const speakerStand_ui = defineFurnitureUi<typeof speakerStand_schema>({
	name: i18n.ts._miRoom._objects.speakerStand,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._speakerStand.bodyMat,
		},
		height: {
			label: i18n.ts._miRoom._objects._speakerStand.height,
		},
	},
});

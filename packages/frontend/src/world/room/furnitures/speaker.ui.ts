/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { speaker_schema } from 'misskey-world/src/room/furnitures/speaker.schema.js';
import { i18n } from '@/i18n.js';

export const speaker_ui = defineFurnitureUi<typeof speaker_schema>({
	name: i18n.ts._miRoom._furnitures.speaker,
	options: {
		outerMat: {
			label: i18n.ts._miRoom._furnitures._speaker.outerMat,
		},
		innerMat: {
			label: i18n.ts._miRoom._furnitures._speaker.innerMat,
		},
	},
});

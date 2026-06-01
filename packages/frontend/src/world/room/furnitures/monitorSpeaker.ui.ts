/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { monitorSpeaker_schema } from 'misskey-world/src/room/furnitures/monitorSpeaker.schema.js';
import { i18n } from '@/i18n.js';

export const monitorSpeaker_ui = defineFurnitureUi<typeof monitorSpeaker_schema>({
	name: i18n.ts._miRoom._furnitures.monitorSpeaker,
	options: {
		mat: {
			label: i18n.ts._miRoom._furnitures._monitorSpeaker.mat,
		},
	},
});

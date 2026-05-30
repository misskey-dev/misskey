/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { djPlayer_schema } from 'misskey-world/src/room/objects/djPlayer.schema.js';
import { i18n } from '@/i18n.js';

export const djPlayer_ui = defineFunitureUi<typeof djPlayer_schema>({
	name: i18n.ts._miRoom._objects.djPlayer,
	options: {
		screenBrightness: {
			label: i18n.ts._miRoom._objects._djPlayer.screenBrightness,
		},
		image: {
			label: i18n.ts._miRoom._objects._djPlayer.image,
			presets: {
				'waveform': {
					label: i18n.ts._miRoom._objects._djPlayer['image:waveform'],
				},
			},
		},
	},
});

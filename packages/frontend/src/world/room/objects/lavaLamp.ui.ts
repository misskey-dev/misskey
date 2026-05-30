/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { lavaLamp_schema } from 'misskey-world/src/room/objects/lavaLamp.schema.js';
import { i18n } from '@/i18n.js';

export const lavaLamp_ui = defineFunitureUi<typeof lavaLamp_schema>({
	name: i18n.ts._miRoom._objects.lavaLamp,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._lavaLamp.bodyMat,
		},
		glassMat: {
			label: i18n.ts._miRoom._objects._lavaLamp.glassMat,
		},
		lightColor: {
			label: i18n.ts._miRoom._objects._lavaLamp.lightColor,
		},
		lavaColor: {
			label: i18n.ts._miRoom._objects._lavaLamp.lavaColor,
		},
	},
});

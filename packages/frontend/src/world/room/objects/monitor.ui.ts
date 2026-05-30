/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { monitor_schema } from 'misskey-world/src/room/objects/monitor.schema.js';
import { i18n } from '@/i18n.js';

export const monitor_ui = defineFunitureUi<typeof monitor_schema>({
	name: i18n.ts._miRoom._objects.monitor,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._monitor.bodyMat,
		},
		screenBrightness: {
			label: i18n.ts._miRoom._objects._monitor.screenBrightness,
		},
		image: {
			label: i18n.ts._miRoom._objects._monitor.image,
		},
	},
});

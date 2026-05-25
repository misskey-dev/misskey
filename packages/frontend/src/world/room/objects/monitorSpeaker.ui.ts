/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { monitorSpeaker_schema } from './monitorSpeaker.schema.js';
import { i18n } from '@/i18n.js';

export const monitorSpeaker_ui = defineObjectUi<typeof monitorSpeaker_schema>({
	name: i18n.ts._miRoom._objects.monitorSpeaker,
	options: {
		mat: {
			label: i18n.ts._miRoom._objects._monitorSpeaker.mat,
		},
	},
});

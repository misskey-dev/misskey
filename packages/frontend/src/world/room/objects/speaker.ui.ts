/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { speaker_schema } from 'misskey-world/src/room/objects/speaker.schema.js';
import { i18n } from '@/i18n.js';

export const speaker_ui = defineObjectUi<typeof speaker_schema>({
	name: i18n.ts._miRoom._objects.speaker,
	options: {
		outerMat: {
			label: i18n.ts._miRoom._objects._speaker.outerMat,
		},
		innerMat: {
			label: i18n.ts._miRoom._objects._speaker.innerMat,
		},
	},
});

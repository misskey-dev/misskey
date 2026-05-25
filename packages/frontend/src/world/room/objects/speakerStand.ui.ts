/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { speakerStand } from './speakerStand.js';
import { i18n } from '@/i18n.js';

export const speakerStand_ui = defineObjectUi<typeof speakerStand>({
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

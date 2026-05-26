/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { wallGlassPictureFrame_schema } from 'misskey-world/src/room/objects/wallGlassPictureFrame.schema.js';
import { i18n } from '@/i18n.js';

export const wallGlassPictureFrame_ui = defineObjectUi<typeof wallGlassPictureFrame_schema>({
	name: i18n.ts._miRoom._objects.wallGlassPictureFrame,
	options: {
		width: {
			label: i18n.ts._miRoom._objects._wallGlassPictureFrame.width,
		},
		height: {
			label: i18n.ts._miRoom._objects._wallGlassPictureFrame.height,
		},
		image: {
			label: i18n.ts._miRoom._objects._wallGlassPictureFrame.image,
		},
	},
});

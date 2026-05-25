/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { tabletopGlassPictureFrame } from './tabletopGlassPictureFrame.js';
import { i18n } from '@/i18n.js';

export const tabletopGlassPictureFrame_ui = defineObjectUi<typeof tabletopGlassPictureFrame>({
	name: i18n.ts._miRoom._objects.tabletopGlassPictureFrame,
	options: {
		width: {
			label: i18n.ts._miRoom._objects._tabletopGlassPictureFrame.width,
		},
		height: {
			label: i18n.ts._miRoom._objects._tabletopGlassPictureFrame.height,
		},
		image: {
			label: i18n.ts._miRoom._objects._tabletopGlassPictureFrame.image,
		},
	},
});

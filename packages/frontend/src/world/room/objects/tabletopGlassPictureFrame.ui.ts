/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { tabletopGlassPictureFrame_schema } from 'misskey-world/src/room/objects/tabletopGlassPictureFrame.schema.js';
import { i18n } from '@/i18n.js';

export const tabletopGlassPictureFrame_ui = defineFunitureUi<typeof tabletopGlassPictureFrame_schema>({
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

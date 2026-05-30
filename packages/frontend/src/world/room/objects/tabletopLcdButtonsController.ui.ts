/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { tabletopLcdButtonsController_schema } from 'misskey-world/src/room/objects/tabletopLcdButtonsController.schema.js';
import { i18n } from '@/i18n.js';

export const tabletopLcdButtonsController_ui = defineFunitureUi<typeof tabletopLcdButtonsController_schema>({
	name: i18n.ts._miRoom._objects.tabletopLcdButtonsController,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._tabletopLcdButtonsController.bodyMat,
		},
		screenBrightness: {
			label: i18n.ts._miRoom._objects._tabletopLcdButtonsController.screenBrightness,
		},
		image: {
			label: i18n.ts._miRoom._objects._tabletopLcdButtonsController.image,
		},
	},
});

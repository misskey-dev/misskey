/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { tabletopLcdButtonsController_schema } from 'misskey-world/src/room/furnitures/tabletopLcdButtonsController.schema.js';
import { i18n } from '@/i18n.js';

export const tabletopLcdButtonsController_ui = defineFurnitureUi<typeof tabletopLcdButtonsController_schema>({
	name: i18n.ts._miRoom._furnitures.tabletopLcdButtonsController,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._furnitures._tabletopLcdButtonsController.bodyMat,
		},
		screenBrightness: {
			label: i18n.ts._miRoom._furnitures._tabletopLcdButtonsController.screenBrightness,
		},
		image: {
			label: i18n.ts._miRoom._furnitures._tabletopLcdButtonsController.image,
		},
	},
});

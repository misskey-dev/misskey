/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { desktopPc_schema } from 'misskey-world/src/room/furnitures/desktopPc.schema.js';
import { i18n } from '@/i18n.js';

export const desktopPc_ui = defineFurnitureUi<typeof desktopPc_schema>({
	name: i18n.ts._miRoom._furnitures.desktopPc,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._furnitures._desktopPc.bodyMat,
		},
		coverMat: {
			label: i18n.ts._miRoom._furnitures._desktopPc.coverMat,
		},
		inner1Mat: {
			label: i18n.ts._miRoom._furnitures._desktopPc.inner1Mat,
		},
		inner2Mat: {
			label: i18n.ts._miRoom._furnitures._desktopPc.inner2Mat,
		},
		inner3Mat: {
			label: i18n.ts._miRoom._furnitures._desktopPc.inner3Mat,
		},
		ledColor: {
			label: i18n.ts._miRoom._furnitures._desktopPc.ledColor,
		},
	},
});

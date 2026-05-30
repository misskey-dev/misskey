/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { boxWallShelf_schema } from 'misskey-world/src/room/furnitures/boxWallShelf.schema.js';
import { i18n } from '@/i18n.js';

export const boxWallShelf_ui = defineFurnitureUi<typeof boxWallShelf_schema>({
	name: i18n.ts._miRoom._objects.boxWallShelf,
	options: {
		width: {
			label: i18n.ts._miRoom._objects._boxWallShelf.width,
		},
		height: {
			label: i18n.ts._miRoom._objects._boxWallShelf.height,
		},
		bodyMat: {
			label: i18n.ts._miRoom._objects._boxWallShelf.bodyMat,
		},
		withBack: {
			label: i18n.ts._miRoom._objects._boxWallShelf.withBack,
		},
	},
});

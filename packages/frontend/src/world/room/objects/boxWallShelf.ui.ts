/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { boxWallShelf_schema } from 'misskey-world/src/room/objects/boxWallShelf.schema.js';
import { i18n } from '@/i18n.js';

export const boxWallShelf_ui = defineObjectUi<typeof boxWallShelf_schema>({
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
